import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";

export default function CampusDropdown({
  label,
  required = false,
  value,
  options = [],
  onSelect,
  placeholder = "Select an option...",
  themeColor = Colors.marigold,
  helperText,
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Normalize options to object format { label, value, icon, desc }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "string") {
      return { label: opt, value: opt };
    }
    return {
      label: opt.label || opt.name || opt.value,
      value: opt.value || opt.name || opt.label,
      icon: opt.icon,
      desc: opt.desc || opt.sub,
    };
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value) || null;

  const handleSelect = (val) => {
    onSelect(val);
    setIsOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.requiredStar}>*</Text>}
        </Text>
      )}

      {/* Trigger Button */}
      <TouchableOpacity
        style={[
          styles.trigger,
          isOpen && { borderColor: themeColor, borderWidth: 2 },
        ]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <View style={styles.triggerContent}>
          {selectedOption?.icon ? (
            <View style={[styles.iconContainer, { backgroundColor: Colors.surface }]}>
              <Ionicons name={selectedOption.icon} size={18} color={themeColor} />
            </View>
          ) : (
            <View style={styles.iconContainer}>
              <Ionicons name="list-outline" size={18} color={Colors.stone} />
            </View>
          )}

          <View style={styles.textContainer}>
            <Text
              style={[
                styles.selectedText,
                !selectedOption && styles.placeholderText,
              ]}
              numberOfLines={1}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </Text>
            {selectedOption?.desc ? (
              <Text style={styles.subText} numberOfLines={1}>
                {selectedOption.desc}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.arrowBadge}>
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color={Colors.ink}
          />
        </View>
      </TouchableOpacity>

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      {/* Dropdown Selection Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalCard}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.headerTitleRow}>
                    <Ionicons name="options-outline" size={20} color={themeColor} />
                    <Text style={styles.modalTitle}>{label || "Select Option"}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setIsOpen(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={20} color={Colors.stone} />
                  </TouchableOpacity>
                </View>

                {/* Options List */}
                <ScrollView
                  style={styles.optionsList}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {normalizedOptions.map((opt) => {
                    const isSelected = opt.value === value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.optionItem,
                          isSelected && [styles.optionItemSelected, { backgroundColor: "#FAF5EA" }],
                        ]}
                        onPress={() => handleSelect(opt.value)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.optionLeft}>
                          {opt.icon ? (
                            <View
                              style={[
                                styles.optionIconCircle,
                                isSelected && { backgroundColor: themeColor, borderColor: themeColor },
                              ]}
                            >
                              <Ionicons
                                name={opt.icon}
                                size={18}
                                color={isSelected ? Colors.surface : Colors.ink}
                              />
                            </View>
                          ) : null}

                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.optionLabel,
                                isSelected && [styles.optionLabelSelected, { color: themeColor }],
                              ]}
                            >
                              {opt.label}
                            </Text>
                            {opt.desc ? (
                              <Text style={styles.optionDesc}>{opt.desc}</Text>
                            ) : null}
                          </View>
                        </View>

                        {isSelected ? (
                          <View style={[styles.checkCircle, { backgroundColor: themeColor }]}>
                            <Ionicons name="checkmark" size={14} color={Colors.surface} />
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.ink,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
  },
  requiredStar: {
    color: Colors.rust,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.paper,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  triggerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.ink,
  },
  placeholderText: {
    color: Colors.stone,
    fontWeight: "normal",
  },
  subText: {
    fontSize: 11,
    color: Colors.stone,
    marginTop: 1,
  },
  arrowBadge: {
    padding: 4,
  },
  helperText: {
    fontSize: 11,
    color: Colors.stone,
    marginTop: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    maxHeight: "80%",
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
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.paper,
    marginBottom: 8,
  },
  headerTitleRow: {
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
  closeBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: Colors.paper,
  },
  optionsList: {
    maxHeight: 380,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: 4,
  },
  optionItemSelected: {
    borderColor: Colors.border,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  optionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.ink,
  },
  optionLabelSelected: {
    fontWeight: "bold",
  },
  optionDesc: {
    fontSize: 11,
    color: Colors.stone,
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});
