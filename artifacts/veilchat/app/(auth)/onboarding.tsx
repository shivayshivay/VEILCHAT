import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";

const { width: W } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: "lock-closed" as const,
    iconBg: "#00F5D422",
    title: "Private Conversations",
    subtitle:
      "Every message is end-to-end encrypted. Only you and your recipient can ever read them.",
    accent: "#00F5D4",
  },
  {
    id: "2",
    icon: "call" as const,
    iconBg: "#7C3AED22",
    title: "Secure Voice & Video",
    subtitle:
      "Crystal-clear calls with military-grade encryption. No one can listen in — ever.",
    accent: "#7C3AED",
  },
  {
    id: "3",
    icon: "shield-checkmark" as const,
    iconBg: "#10B98122",
    title: "Your Data, Your Control",
    subtitle:
      "We never store your messages on our servers. They live only on your devices.",
    accent: "#10B981",
  },
];

function Slide({ item, index, scrollX }: { item: typeof SLIDES[0]; index: number; scrollX: SharedValue<number> }) {
  const iconScale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * W, index * W, (index + 1) * W];
    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP);
    const scale = interpolate(scrollX.value, inputRange, [0.85, 1, 0.85], Extrapolation.CLAMP);
    const translateY = interpolate(scrollX.value, inputRange, [30, 0, 30], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }, { translateY }] };
  });

  return (
    <Animated.View style={[styles.slide, animStyle]}>
      <View style={[styles.iconOuter, { backgroundColor: item.iconBg, borderColor: item.accent + "44" }]}>
        <View style={[styles.iconInner, { backgroundColor: item.iconBg }]}>
          <Ionicons name={item.icon} size={48} color={item.accent} />
        </View>
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideSub}>{item.subtitle}</Text>
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setHasSeenOnboarding } = useAuthStore();
  const [current, setCurrent] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const botPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 24);
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: current + 1, animated: true });
    } else {
      handleDone();
    }
  };

  const handleDone = () => {
    setHasSeenOnboarding(true);
    router.replace("/(auth)/login");
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) setCurrent(viewableItems[0].index ?? 0);
  }).current;

  const isLast = current === SLIDES.length - 1;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.skipRow}>
        {!isLast ? (
          <Pressable onPress={handleDone} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Slide item={item} index={index} scrollX={scrollX} />
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        style={styles.list}
      />

      <View style={[styles.bottom, { paddingBottom: botPad }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const isActive = i === current;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        <Pressable onPress={handleNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>
            {isLast ? "Get Started" : "Next"}
          </Text>
          {!isLast && <Ionicons name="arrow-forward" size={18} color="#0A0A0A" style={{ marginLeft: 6 }} />}
        </Pressable>
      </View>
    </View>
  );
}

const CYAN = "#00F5D4";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0A" },
  skipRow: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 24, paddingVertical: 12 },
  skipBtn: { padding: 8 },
  skipText: { fontFamily: "Inter_500Medium", fontSize: 14, color: "#6B7280" },
  list: { flex: 1 },
  slide: {
    width: W,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 24,
  },
  iconOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  slideTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: "#E5E7EB",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  slideSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  bottom: { paddingHorizontal: 32, gap: 28, alignItems: "center" },
  dots: { flexDirection: "row", gap: 8 },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 24, backgroundColor: CYAN },
  dotInactive: { width: 6, backgroundColor: "#374151" },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CYAN,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
  },
  nextText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#0A0A0A",
  },
});
