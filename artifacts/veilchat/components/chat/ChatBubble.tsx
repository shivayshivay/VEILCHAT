import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Message } from "@/context/ChatContext";

interface Props {
  message: Message;
  isMine: boolean;
}

function formatMsgTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function ChatBubble({ message, isMine }: Props) {
  const colors = useColors();

  const bg = isMine ? colors.bubbleSelf : colors.bubble;
  const textColor = isMine ? colors.bubbleSelfText : colors.foreground;

  return (
    <View style={[styles.wrapper, isMine ? styles.wrapperRight : styles.wrapperLeft]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bg,
            borderRadius: colors.radius,
            borderBottomRightRadius: isMine ? 4 : colors.radius,
            borderBottomLeftRadius: isMine ? colors.radius : 4,
          },
        ]}
      >
        <Text style={[styles.text, { color: textColor, fontFamily: "Inter_400Regular" }]}>
          {message.text}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.time, { color: isMine ? colors.primaryForeground + "99" : colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {formatMsgTime(message.timestamp)}
          </Text>
          {isMine && (
            <Ionicons
              name={message.status === "read" ? "checkmark-done" : "checkmark"}
              size={13}
              color={message.status === "read" ? colors.primaryForeground : colors.primaryForeground + "80"}
              style={{ marginLeft: 3 }}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 2,
    paddingHorizontal: 16,
    maxWidth: "82%",
  },
  wrapperRight: {
    alignSelf: "flex-end",
  },
  wrapperLeft: {
    alignSelf: "flex-start",
  },
  bubble: {
    paddingHorizontal: 13,
    paddingTop: 9,
    paddingBottom: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 3,
    gap: 2,
  },
  time: {
    fontSize: 11,
  },
});
