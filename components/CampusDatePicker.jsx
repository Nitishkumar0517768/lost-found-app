import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const parseISODate = (str) => {
  if (!str) return new Date();
  const parts = str.split("-").map(Number);
  if (parts.length === 3) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(str);
};

const toISODateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function CampusDatePicker({
  value,
  onChange,
  label = "Select Date",
  maxDate = new Date(),
}) {
  const [modalVisible, setModalVisible] = useState(false);

  // Clean local today reference
  const now = maxDate || new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Parse current selected date
  const selectedDate = value ? parseISODate(value) : today;

  // Viewing month and year in calendar
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const handleOpen = () => {
    const currentSelected = value ? parseISODate(value) : today;
    setViewYear(currentSelected.getFullYear());
    setViewMonth(currentSelected.getMonth());
    setModalVisible(true);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  // Determine if viewing month is current month/year or beyond
  const isCurrentMonthOrBeyond =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

  const handleNextMonth = () => {
    if (isCurrentMonthOrBeyond) return; // Prevent navigating to future months
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day) => {
    const candidate = new Date(viewYear, viewMonth, day);
    if (candidate.getTime() > today.getTime()) {
      return; // Restricted: future date
    }
    const iso = toISODateString(candidate);
    onChange(iso);
    setModalVisible(false);
  };

  const handleSelectToday = () => {
    onChange(toISODateString(today));
    setModalVisible(false);
  };

  const handleSelectYesterday = () => {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    onChange(toISODateString(yesterday));
    setModalVisible(false);
  };

  // Generate calendar grid for current viewMonth/viewYear
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  // Empty leading cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ key: `empty-${i}`, empty: true });
  }
  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(viewYear, viewMonth, day);
    const isFuture = cellDate.getTime() > today.getTime();
    const isSelected =
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day;
    const isToday =
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day;

    cells.push({
      key: `day-${day}`,
      day,
      isFuture,
      isSelected,
      isToday,
    });
  }

  // Format readable display
  const displayString = selectedDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isSelectedToday =
    selectedDate.getFullYear() === today.getFullYear() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getDate() === today.getDate();

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* Interactive Date Trigger */}
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={handleOpen}
        activeOpacity={0.7}
      >
        <View style={styles.triggerLeft}>
          <View style={styles.calendarIconContainer}>
            <Ionicons name="calendar" size={18} color={Colors.marigold} />
          </View>
          <View>
            <Text style={styles.triggerDateText}>{displayString}</Text>
            <Text style={styles.triggerIsoText}>
              {value} {isSelectedToday ? "• Today" : ""}
            </Text>
          </View>
        </View>

        <View style={styles.changeBadge}>
          <Text style={styles.changeBadgeText}>Change</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.marigold} />
        </View>
      </TouchableOpacity>

      {/* Calendar Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={styles.modalCard}
            onStartShouldSetResponder={() => true}
          >
            {/* Modal Title & Close */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="calendar-outline" size={20} color={Colors.ink} />
                <Text style={styles.modalTitle}>{label || "Select Date"}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={Colors.stone} />
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation */}
            <View style={styles.monthNavRow}>
              <TouchableOpacity
                style={styles.navArrowBtn}
                onPress={handlePrevMonth}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={20} color={Colors.ink} />
              </TouchableOpacity>

              <Text style={styles.monthYearText}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>

              <TouchableOpacity
                style={[
                  styles.navArrowBtn,
                  isCurrentMonthOrBeyond && styles.navArrowBtnDisabled,
                ]}
                onPress={handleNextMonth}
                disabled={isCurrentMonthOrBeyond}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isCurrentMonthOrBeyond ? Colors.border : Colors.ink}
                />
              </TouchableOpacity>
            </View>

            {/* Weekday Headers */}
            <View style={styles.weekdaysRow}>
              {DAYS_OF_WEEK.map((d, index) => (
                <Text
                  key={d}
                  style={[
                    styles.weekdayText,
                    (index === 0 || index === 6) && styles.weekendText,
                  ]}
                >
                  {d}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {cells.map((cell) => {
                if (cell.empty) {
                  return <View key={cell.key} style={styles.dayCell} />;
                }

                const { day, isFuture, isSelected, isToday } = cell;

                return (
                  <TouchableOpacity
                    key={cell.key}
                    style={[
                      styles.dayCell,
                      isToday && !isSelected && styles.dayCellToday,
                      isSelected && styles.dayCellSelected,
                      isFuture && styles.dayCellFuture,
                    ]}
                    onPress={() => handleSelectDay(day)}
                    disabled={isFuture}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        isToday && !isSelected && styles.dayNumberTodayText,
                        isSelected && styles.dayNumberSelectedText,
                        isFuture && styles.dayNumberFutureText,
                      ]}
                    >
                      {day}
                    </Text>
                    {isToday && !isSelected ? (
                      <View style={styles.todayDot} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Presets (Today / Yesterday) */}
            <View style={styles.quickBar}>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={handleSelectToday}
              >
                <Text style={styles.quickBtnText}>Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickBtn}
                onPress={handleSelectYesterday}
              >
                <Text style={styles.quickBtnText}>Yesterday</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.stone,
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  triggerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: Colors.ink,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 0,
    elevation: 1,
  },
  triggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  calendarIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.paper,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  triggerDateText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "serif",
  },
  triggerIsoText: {
    fontSize: 11,
    color: Colors.stone,
    fontFamily: "monospace",
    marginTop: 2,
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: Colors.paper,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changeBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.marigold,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 18,
    shadowColor: Colors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.paper,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "serif",
  },
  monthNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    marginTop: 10,
    marginBottom: 6,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: Colors.paper,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navArrowBtnDisabled: {
    backgroundColor: Colors.surface,
    borderColor: Colors.paper,
    opacity: 0.4,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "serif",
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 6,
  },
  weekdayText: {
    width: 38,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.stone,
  },
  weekendText: {
    color: Colors.marigold,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  dayCell: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 3,
    borderRadius: 19,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.marigold,
  },
  dayCellSelected: {
    backgroundColor: Colors.marigold,
  },
  dayCellFuture: {
    opacity: 0.25,
  },
  dayNumberText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.ink,
  },
  dayNumberTodayText: {
    color: Colors.marigold,
    fontWeight: "bold",
  },
  dayNumberSelectedText: {
    color: Colors.surface,
    fontWeight: "bold",
  },
  dayNumberFutureText: {
    color: Colors.stone,
    textDecorationLine: "line-through",
  },
  todayDot: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.marigold,
  },
  quickBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.paper,
  },
  quickBtn: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.ink,
  },
});
