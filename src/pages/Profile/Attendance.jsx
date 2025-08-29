import { useState } from "react";
import { CalendarClock, CheckCircle2, XCircle, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("ru-RU", {
    month: "long",
    day: "numeric",
  });

const formatTime = (timeString) => (timeString ? timeString.slice(0, 5) : "");

const Attendance = ({ userData }) => {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedHour, setSelectedHour] = useState("");

  const attendedDays =
    userData.attendances?.filter((a) => a.status === "present").length || 0;
  const absentDays =
    userData.attendances?.filter((a) => a.status === "absent").length || 0;

  const getSalaryForAttendance = (id) =>
    userData?.attendance_salaries?.find((a) => a.attendance_id === id)
      ?.amount || 0;

  const getHolidayData = (date) =>
    userData?.holidays?.find(
      (holiday) =>
        new Date(date) >= new Date(holiday.start_date) &&
        new Date(date) <= new Date(holiday.end_date)
    );

  const getAbsenceData = (date) =>
    userData?.absences?.find((absence) => absence.start_date === date);

  const handleImageClick = (image, date, time) => {
    setSelectedImage(image);
    setSelectedDate(formatDate(date));
    setSelectedHour(time);
    setImageDialogOpen(true);
  };

  /** Render helpers */
  const renderCheck = (time, image, label, date) => (
    <div className="flex items-center gap-1">
      {formatTime(time.split(" ")[1])}
      {image && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            handleImageClick(
              image,
              date,
              `${label}: ${formatTime(time.split(" ")[1])}`
            )
          }
        >
          <Images className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const renderHoliday = (holiday) => (
    <div className="flex items-center gap-2 flex-wrap">
      {holiday.image && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSelectedImage(holiday.image);
            setImageDialogOpen(true);
          }}
        >
          <Images />
        </Button>
      )}
      <div className="rounded-full bg-green-500 text-white px-2 py-1 w-fit text-xs">
        Sababli
      </div>
      <div>{holiday.comment}</div>
    </div>
  );

  const renderAbsence = (absence) => (
    <div className="flex items-center gap-2 flex-wrap">
      {absence.image && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSelectedImage(absence.image);
            setImageDialogOpen(true);
          }}
        >
          <Images />
        </Button>
      )}
      <div className="rounded-full bg-red-500 text-white px-2 py-1 w-fit text-xs">
        Sababsiz
      </div>
      <div>{absence.comment}</div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-green-100 text-center shadow-sm">
            <p className="text-green-700 font-bold text-lg">{attendedDays}</p>
            <p className="text-sm text-green-600">Kun kelgan</p>
          </div>
          <div className="p-4 rounded-2xl bg-red-100 text-center shadow-sm">
            <p className="text-red-700 font-bold text-lg">{absentDays}</p>
            <p className="text-sm text-red-600">Kun kelmagan</p>
          </div>
        </div>

        {/* Attendance list */}
        {userData.attendances?.length > 0 ? (
          <div className="space-y-3">
            {userData.attendances
              ?.sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((attendance, i) => {
                const isPresent = attendance.status === "present";
                const salary = getSalaryForAttendance(attendance.id);
                const holidayData = getHolidayData(attendance.date);
                const absenceData = getAbsenceData(attendance.date);

                return (
                  <motion.div
                    key={attendance.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.15,
                      ease: "easeOut",
                      delay: i * 0.025,
                    }}
                    viewport={{ once: true }}
                    className={`flex items-center justify-between flex-wrap gap-2 p-4 rounded-xl shadow-sm hover:shadow-md transition border-l-4 ${
                      isPresent
                        ? "border-green-500 bg-green-50/40"
                        : "border-red-500 bg-red-50/40"
                    }`}
                  >
                    {/* Left */}
                    <div className="flex items-center gap-3">
                      {isPresent ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                      <div>
                        <p className="font-semibold">
                          {formatDate(attendance.date)}
                        </p>
                        {salary > 0 && (
                          <p className="text-sm text-blue-600 font-medium">
                            +{" "}
                            {parseFloat(salary).toLocaleString("ru-RU", {
                              maximumFractionDigits: 0,
                            })}{" "}
                            so'm
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      {attendance.check_in &&
                        renderCheck(
                          attendance.check_in,
                          attendance.check_in_image,
                          "Keldi",
                          attendance.date
                        )}
                      {attendance.check_out &&
                        renderCheck(
                          attendance.check_out,
                          attendance.check_out_image,
                          "Ketdi",
                          attendance.date
                        )}
                      {attendance.status === "absent" && (
                        <>
                          {holidayData && renderHoliday(holidayData)}
                          {absenceData && renderAbsence(absenceData)}
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-12">
            <CalendarClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Tanlangan sana oralig'ida davomat ma'lumotlari yo'q
            </p>
          </div>
        )}
      </div>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedDate}</DialogTitle>
            <DialogDescription>{selectedHour}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Davomat"
                className="max-w-full md:max-h-[600px] max-h-[60vh] rounded-lg shadow"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Attendance;
