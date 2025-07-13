"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";

interface DateFilterProps {
  onDateChange: (startDate?: Date, endDate?: Date) => void;
  className?: string;
}

export function DateFilter({ onDateChange, className }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  useEffect(() => {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    onDateChange(startOfDay, endOfDay);
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      // Set the date range to the selected date (same day)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      onDateChange(startOfDay, endOfDay);
      setIsOpen(false);
    }
  };

  const handleClearFilter = () => {
    setSelectedDate(undefined);
    onDateChange(undefined, undefined);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-5 w-5" />
            Filter by Date
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Date Display */}
          {selectedDate && (
            <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">
                Showing events for:{" "}
                <span className="font-medium text-gray-900">
                  {format(selectedDate, "MMMM d, yyyy")}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilter}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Calendar */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>

            {isOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white border rounded-md shadow-lg">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border"
                />
              </div>
            )}
          </div>

          {/* Instructions */}
          <p className="text-xs text-gray-500">
            Select a date to view events for that specific day. Click the X
            button to clear the filter and view all events.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
