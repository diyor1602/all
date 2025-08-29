import { Button } from "@/components/ui/button";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Image,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Images } from "lucide-react";
import { useState } from "react";

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (timeString) => {
  return timeString ? timeString.slice(0, 5) : "";
};

const Attendance = ({ userData }) => {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const attendedDays =
    userData.attendances?.filter((a) => a.status === "present").length || 0;
  const absentDays =
    userData.attendances?.filter((a) => a.status === "absent").length || 0;

  const getAbsenceData = (date) => {
    return userData?.absences?.find((absence) => absence.start_date === date);
  };

  const getHolidayData = (date) => {
    return userData?.holidays?.find(
      (holiday) =>
        new Date(date) >= new Date(holiday.start_date) &&
        new Date(date) <= new Date(holiday.end_date)
    );
  };
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 items-center">
          <div className="p-4 rounded-xl bg-blue-100 text-center">
            <p className="font-medium text-blue-700">
              {attendedDays} kun kelgan
            </p>
          </div>
          <div className="p-4 rounded-xl bg-red-100 text-center">
            <p className="font-medium text-red-700">
              {absentDays} kun kelmagan
            </p>
          </div>
        </div>
        {userData.attendances?.length > 0 ? (
          <div className="space-y-3">
            {userData.attendances
              ?.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;
              })
              .map((attendance) => (
                <div
                  key={attendance.id}
                  className={`flex items-center justify-between p-4 border rounded-lg flex-wrap gap-2 ${
                    attendance.status === "present"
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {attendance.status === "present" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {formatDate(attendance.date)}
                      </p>
                      {userData?.attendance_salaries?.find(
                        (a) => a.attendance_id === attendance.id
                      ) && (
                        <p className="text-xs text-muted-foreground">
                          Topgan puli:{" "}
                          <span className="font-semibold">
                            {parseFloat(
                              userData.attendance_salaries.find(
                                (a) => a.attendance_id === attendance.id
                              )?.amount || 0
                            )?.toLocaleString("ru-RU")}{" "}
                          </span>
                          so'm
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    {attendance.check_in && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>
                          Keldi: {formatTime(attendance.check_in.split(" ")[1])}
                        </span>
                        {attendance.check_in_image && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedImage(attendance.check_in_image);
                              setImageDialogOpen(true);
                            }}
                          >
                            <Images />
                          </Button>
                        )}
                      </div>
                    )}
                    {attendance.check_out && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>
                          Ketdi:{" "}
                          {formatTime(attendance.check_out.split(" ")[1])}
                        </span>
                        {attendance.check_out_image && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedImage(attendance.check_out_image);
                              setImageDialogOpen(true);
                            }}
                          >
                            <Images />
                          </Button>
                        )}
                      </div>
                    )}
                    {getAbsenceData(attendance.date) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {getAbsenceData(attendance.date)?.image && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedImage(
                                getAbsenceData(attendance.date)?.image
                              );
                              setImageDialogOpen(true);
                            }}
                          >
                            <Images />
                          </Button>
                        )}
                        <div className="rounded-full bg-red-500 text-white px-2 py-1 w-fit text-xs">
                          Sababsiz
                        </div>
                        <div>{getAbsenceData(attendance.date)?.comment}</div>
                      </div>
                    )}
                    {getHolidayData(attendance.date) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {getHolidayData(attendance.date)?.image && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedImage(
                                getHolidayData(attendance.date)?.image
                              );
                              setImageDialogOpen(true);
                            }}
                          >
                            <Images />
                          </Button>
                        )}
                        <div className="rounded-full bg-green-500 text-white px-2 py-1 w-fit text-xs">
                          Sababli
                        </div>
                        <div>{getHolidayData(attendance.date)?.comment}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CalendarClock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Tanlangan sana oralig'ida davomat ma'lumotlari topilmadi
            </p>
          </div>
        )}
      </div>
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogHeader>
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <DialogContent className="max-w-lg">
          <div className="flex items-center justify-center">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Attendance"
                className="max-w-full max-h-[600px]"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Attendance;
