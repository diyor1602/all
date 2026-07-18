import React, { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowRight,
  Trophy,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import formatNumber from "@/utils/formatNumber";

const calculateMinutes = (works) => {
  const minutes = parseFloat(
    works?.reduce((acc, work) => acc + parseFloat(work.second), 0) / 60,
  )?.toFixed(2);
  return { value: minutes, over: parseFloat(minutes) >= 2 };
};

const formatMoney = (value) =>
  parseFloat(value)?.toLocaleString("en-EN", { maximumFractionDigits: 0 });

// display order: [2nd place, 1st place, 3rd place]
const PODIUM_SLOTS = [
  {
    rank: 1,
    emoji: "🥈",
    baseH: "h-14",
    baseGrad: "from-slate-300 to-slate-400",
    ring: "ring-[3px] ring-slate-300",
    avatarSize: "w-12 h-12",
    earnColor: "text-slate-200",
  },
  {
    rank: 0,
    emoji: "🥇",
    baseH: "h-20",
    baseGrad: "from-amber-400 to-amber-500",
    ring: "ring-[3px] ring-amber-300",
    avatarSize: "w-16 h-16",
    earnColor: "text-amber-200",
  },
  {
    rank: 2,
    emoji: "🥉",
    baseH: "h-10",
    baseGrad: "from-orange-600 to-orange-700",
    ring: "ring-[3px] ring-orange-400",
    avatarSize: "w-11 h-11",
    earnColor: "text-orange-200",
  },
];

const UserAvatar = ({ user, className, ringClass, onClick }) => {
  if (user?.image) {
    return (
      <img
        src={user.image}
        alt={user.employee_name}
        className={`rounded-full object-cover ${ringClass ?? ""} ring-offset-2 ring-offset-indigo-800 shadow-lg cursor-pointer ${className}`}
        onClick={onClick}
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg ${ringClass ?? ""} ring-offset-2 ring-offset-indigo-800 ${className}`}
    >
      {user?.employee_name?.[0]}
    </div>
  );
};

const WorkDetail = ({ user }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Ish nomi
          </th>
          <th className="text-center px-2 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Soni
          </th>
          <th className="text-center px-2 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            <span className="flex items-center justify-center gap-0.5">
              <Clock className="w-3 h-3" /> Sek
            </span>
          </th>
          <th className="text-right px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Summa
          </th>
        </tr>
      </thead>
      <tbody>
        {user.works
          ?.slice()
          .sort((a, b) => b.quantity - a.quantity)
          .map((work, wi) => (
            <tr
              key={wi}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
            >
              <td className="px-3 py-2 text-xs text-gray-700">
                <span className="text-gray-400 mr-1">{work.code}</span>
                {work.operation}
              </td>
              <td className="px-2 py-2 text-center">
                <span className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 font-semibold rounded-full px-2 py-0.5 text-xs">
                  {work.quantity}
                </span>
              </td>
              <td className="px-2 py-2 text-center text-gray-500 tabular-nums text-xs">
                {parseFloat(work.second)?.toLocaleString("en-EN", {
                  maximumFractionDigits: 0,
                })}
              </td>
              <td className="px-3 py-2 text-right text-xs tabular-nums font-semibold text-gray-700">
                {parseFloat(work.earned)?.toLocaleString("en-EN", {
                  maximumFractionDigits: 0,
                })}{" "}
                <span className="text-gray-400 font-normal">so'm</span>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 animate-pulse">
    <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0" />
    <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
    <div className="flex-1 h-3.5 rounded bg-gray-200" />
    <div className="w-16 h-3.5 rounded bg-gray-200" />
    <div className="w-12 h-3.5 rounded bg-gray-200" />
    <div className="w-8 h-3.5 rounded bg-gray-200" />
  </div>
);

const TailorRating = () => {
  const { toast } = useToast();

  const [selectedDay, setSelectedDay] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [users, setUsers] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [podiumSelected, setPodiumSelected] = useState(null);
  const [selectedUser, setSelectedUser] = useState({});
  const [imgDialog, setImgDialog] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleDirection = (direction) => {
    const d = new Date(selectedDay);
    d.setDate(d.getDate() + direction);
    setSelectedDay(d.toISOString().split("T")[0]);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        localStorage.getItem("role") === "groupMaster"
          ? "groupMaster/topEarners"
          : "topEarners",
        { params: { date: selectedDay } },
      );
      const data = response.data?.top_earners ?? [];
      const maxQty = Math.max(
        ...data.map(
          (u) => u.works?.reduce((m, w) => Math.max(m, w.quantity), 0) ?? 0,
        ),
      );
      setMaxQuantity(maxQty);
      setUsers(data);
      setPodiumSelected(null);
      setExpandedRows({});
    } catch (error) {
      toast({
        title: "Xatolik!",
        description: error?.response?.data?.message || "Data olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDay]);

  const isToday = selectedDay === new Date().toISOString().split("T")[0];
  const formattedDate = new Date(selectedDay).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <div className="min-h-screen bg-gray-100/70 pb-10">
        {/* Sticky header */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
              <h1 className="font-bold text-gray-800 text-base truncate">
                Tikuvchilar reytingi
              </h1>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleDirection(-1)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-[136px] h-8 bg-white text-center text-sm px-2"
                max={new Date().toISOString().split("T")[0]}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleDirection(1)}
                disabled={isToday}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-3 mt-4 space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
              <Trophy className="w-12 h-12 opacity-20" />
              <p className="text-sm text-center">
                {formattedDate} uchun ma'lumot yo'q
              </p>
            </div>
          ) : (
            <>
              {/* ── PODIUM ── */}
              <div>
                <div className="bg-gradient-to-b from-indigo-950 via-indigo-900 to-indigo-800 rounded-2xl px-3 pt-5 pb-0 shadow-lg overflow-hidden">
                  <p className="text-center text-[11px] font-semibold text-indigo-400 tracking-[0.2em] uppercase mb-4">
                    ⭐ Top 3 ⭐
                  </p>

                  <div className="flex items-end justify-center gap-2">
                    {PODIUM_SLOTS.map((slot) => {
                      const user = users[slot.rank];
                      if (!user)
                        return <div key={slot.rank} className="flex-1" />;
                      const isSelected = podiumSelected === slot.rank;

                      return (
                        <div
                          key={slot.rank}
                          className="flex-1 flex flex-col items-center cursor-pointer select-none"
                          onClick={() =>
                            setPodiumSelected((p) =>
                              p === slot.rank ? null : slot.rank,
                            )
                          }
                        >
                          {/* Avatar */}
                          <div className="relative mb-2">
                            <UserAvatar
                              user={user}
                              className={slot.avatarSize}
                              ringClass={slot.ring}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser({
                                  image: user.image,
                                  name: user.employee_name,
                                });
                                setImgDialog(true);
                              }}
                            />
                            <span className="absolute -top-2 -right-1 text-base leading-none drop-shadow">
                              {slot.emoji}
                            </span>
                          </div>

                          {/* Name */}
                          <p className="text-white text-xs font-semibold text-center w-full px-0.5 truncate mb-0.5">
                            {user.employee_name?.split(" ")[0]}
                          </p>

                          {/* Earnings */}
                          <p
                            className={`text-[10px] font-medium text-center mb-2.5 ${slot.earnColor} truncate w-full px-1`}
                          >
                            {formatMoney(user.total_earned)} so'm
                          </p>

                          {/* Platform base */}
                          <div
                            className={`w-full ${slot.baseH} bg-gradient-to-t ${slot.baseGrad} rounded-t-lg flex items-center justify-center relative transition-all`}
                          >
                            <span className="text-white/20 font-black text-2xl">
                              {slot.rank + 1}
                            </span>
                            {isSelected && (
                              <ChevronUp className="absolute bottom-1.5 w-3.5 h-3.5 text-white/60" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Expanded details for selected podium user */}
                {podiumSelected !== null && users[podiumSelected] && (
                  <div className="mt-2 px-0.5">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {users[podiumSelected].employee_name?.split(" ")[0]} —
                        ishlari
                      </span>
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => setPodiumSelected(null)}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>
                    <WorkDetail user={users[podiumSelected]} />
                  </div>
                )}
              </div>

              {/* ── REST OF LIST (4th+) ── */}
              {users.length > 3 && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  {/* Column header */}
                  <div className="grid grid-cols-[28px_1fr_84px_72px_52px] px-4 py-2 bg-gray-50 border-b border-gray-200">
                    {["#", "Ism", "Summa", "Soni", "Daqiqa"].map((h, i) => (
                      <span
                        key={i}
                        className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wide ${
                          i > 1 ? "text-right" : ""
                        }`}
                      >
                        {h}
                      </span>
                    ))}
                  </div>

                  {users.slice(3).map((user, i) => {
                    const index = i + 3;
                    const qty =
                      user.works?.reduce(
                        (m, w) => Math.max(m, w.quantity),
                        0,
                      ) ?? 0;
                    const { value: mins, over } = calculateMinutes(user.works);
                    const isExpanded = !!expandedRows[index];

                    return (
                      <React.Fragment key={index}>
                        <div
                          className={`grid grid-cols-[28px_1fr_84px_72px_52px] items-center px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors duration-100 ${
                            isExpanded ? "bg-indigo-50/50" : "hover:bg-gray-50"
                          }`}
                          onClick={() =>
                            setExpandedRows((p) => ({
                              ...p,
                              [index]: !p[index],
                            }))
                          }
                        >
                          <span className="text-xs font-semibold text-gray-400">
                            {index + 1}
                          </span>

                          <div className="flex items-center gap-2 min-w-0">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.employee_name}
                                className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 shrink-0 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUser({
                                    image: user.image,
                                    name: user.employee_name,
                                  });
                                  setImgDialog(true);
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {user.employee_name?.[0]}
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {user.employee_name?.split(" ")[0]}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-semibold text-gray-700 tabular-nums">
                              {formatMoney(user.total_earned)}
                            </span>
                          </div>

                          <div className="flex justify-end text-gray-600 text-xs">
                            {formatNumber(qty)}
                          </div>

                          <div className="flex items-center justify-end gap-0.5">
                            <span
                              className={`text-xs font-semibold tabular-nums ${
                                over ? "text-rose-500" : "text-emerald-600"
                              }`}
                            >
                              {mins}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3 text-gray-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/60">
                            <WorkDetail user={user} />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={imgDialog} onOpenChange={setImgDialog}>
        <DialogContent className="sm:max-w-[400px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedUser?.name}
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <img
            src={selectedUser?.image}
            alt={selectedUser?.name}
            className="w-full h-auto rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TailorRating;
