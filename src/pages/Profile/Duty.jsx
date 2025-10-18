import { Briefcase, ListChecks } from "lucide-react";

const Duty = ({ userData }) => {
  return (
    <div className="p-6 rounded-2xl shadow-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-6 h-6 text-blue-500 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
          {userData?.position || "Lavozim nomi"}
        </h2>
      </div>

      {/* Subtitle */}
      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 mb-3">
        <ListChecks className="w-5 h-5 text-green-500" />
        <span className="text-sm">
          Sizning vazifangiz quyidagilardan iborat:
        </span>
      </div>

      {/* Duties */}
      <div className="whitespace-pre-line text-zinc-700 dark:text-zinc-300 leading-relaxed">
        {userData?.dutie || "Hech qanday vazifa belgilanmagan."}
      </div>
    </div>
  );
};

export default Duty;
