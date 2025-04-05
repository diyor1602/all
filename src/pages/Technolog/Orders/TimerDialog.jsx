import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Play, Square, Save, RotateCcw, Clock, List } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const TimerDialog = ({ isOpen, onClose, onSave }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [measurements, setMeasurements] = useState([]);
  const [averageTime, setAverageTime] = useState(0);
  const timerRef = useRef(null);

  // Reset the timer state whenever the dialog is opened
  useEffect(() => {
    if (isOpen) {
      setIsRunning(false);
      setElapsedTime(0);
      setMeasurements([]);
      setAverageTime(0);
      clearInterval(timerRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 10); // Update every 10ms for a smooth timer
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, startTime]);

  // Calculate average whenever measurements change
  useEffect(() => {
    if (measurements.length > 0) {
      const sum = measurements.reduce((acc, curr) => acc + curr, 0);
      setAverageTime(sum / measurements.length);
    }
  }, [measurements]);

  const startTimer = () => {
    setStartTime(Date.now());
    setElapsedTime(0);
    setIsRunning(true);
  };

  const stopTimer = () => {
    if (isRunning) {
      const timeInSeconds = elapsedTime / 1000;
      setMeasurements([...measurements, timeInSeconds]);
      setIsRunning(false);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setMeasurements([]);
    setAverageTime(0);
  };

  const formatTime = (time) => {
    const totalSeconds = time / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((totalSeconds % 1) * 100);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  };

  const saveAndClose = () => {
    onSave(parseFloat(averageTime)?.toFixed(2));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <span>Vaqt O'lchovi</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          {/* Main Timer Display */}
          <div className="text-5xl font-mono font-bold text-center">
            {formatTime(elapsedTime)}
          </div>

          {/* Progress bar to visualize time passage */}
          <Progress
            value={isRunning ? ((elapsedTime / 1000) % 60) * (100 / 60) : 0}
            className="w-full h-2"
          />

          {/* Timer Controls */}
          <div className="flex space-x-3 mt-4">
            {!isRunning ? (
              <Button
                onClick={startTimer}
                className="bg-green-500 hover:bg-green-600"
              >
                <Play className="mr-2 h-4 w-4" />
                Boshlash
              </Button>
            ) : (
              <Button onClick={stopTimer} variant="destructive">
                <Square className="mr-2 h-4 w-4" />
                To'xtatish
              </Button>
            )}
            <Button
              onClick={resetTimer}
              variant="outline"
              disabled={isRunning || measurements.length === 0}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Tozalash
            </Button>
          </div>

          {/* Measurements List */}
          {measurements.length > 0 && (
            <div className="w-full border rounded-md p-3 mt-4 max-h-40 overflow-y-auto">
              <h3 className="font-medium flex items-center gap-1 mb-2">
                <List className="h-4 w-4" />
                O'lchovlar ({measurements.length})
              </h3>
              <div className="space-y-1">
                {measurements.map((time, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>O'lchov #{index + 1}:</span>
                    <span className="font-mono">{time.toFixed(2)} soniya</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Average Time */}
          {measurements.length >= 3 && (
            <div className="w-full">
              <div className="font-medium text-center">O'rtacha vaqt</div>
              <div className="text-2xl text-center font-bold text-blue-600">
                {averageTime.toFixed(2)} soniya
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Bekor qilish</Button>
          </DialogClose>
          <Button
            onClick={saveAndClose}
            disabled={measurements.length < 3}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Save className="mr-2 h-4 w-4" />
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimerDialog;
