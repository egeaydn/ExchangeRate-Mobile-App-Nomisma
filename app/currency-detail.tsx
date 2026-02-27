/*
*Created BY Ege Aydın
*/
import BottomNavigation from "@/components/BottomNavigation";
import { COLORS } from "@/constants/theme";
import { fetchHistoricalRates } from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function CurrencyDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { code, base, rate } = params;
  const [selectedPeriod, setSelectedPeriod] = useState("HAFTA");
  const [loading, setLoading] = useState(true);

  // Rate zaten TRY karşılığı olarak geliyor (index.tsx'ten)
  const currentRate = parseFloat(rate as string);

  const [chartData, setChartData] = useState({
    labels: [""],
    datasets: [
      {
        data: [currentRate],
      },
    ],
  });

  const periodLow = Math.min(...chartData.datasets[0].data);
  const periodHigh = Math.max(...chartData.datasets[0].data);
  const openRate = chartData.datasets[0].data[0];
  const prevClose =
    chartData.datasets[0].data[chartData.datasets[0].data.length - 2] ||
    openRate;
  const change = ((currentRate - prevClose) / prevClose) * 100;

  // Tarih hesaplama fonksiyonu
  const getDateRange = (period: string) => {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "GÜN":
        startDate.setDate(startDate.getDate() - 1);
        break;
      case "HAFTA":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "AY":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "6 AY":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "YIL":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "5 YIL":
        startDate.setFullYear(startDate.getFullYear() - 5);
        break;
      case "MAX":
        startDate.setFullYear(startDate.getFullYear() - 10);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    };
  };

  // Her periyod için optimal nokta sayısı
  const getOptimalPoints = (period: string) => {
    switch (period) {
      case "GÜN":
        return 8;
      case "HAFTA":
        return 7;
      case "AY":
        return 6;
      case "6 AY":
        return 6;
      case "YIL":
        return 8;
      case "5 YIL":
        return 6;
      case "MAX":
        return 8;
      default:
        return 7;
    }
  };

  // Tarih etiketlerini formatla
  const formatDateLabel = (dateStr: string, period: string) => {
    const date = new Date(dateStr);

    if (period === "GÜN") {
      return date.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (period === "HAFTA") {
      return date.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "numeric",
      });
    } else if (period === "AY") {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      return `${day}/${month}`;
    } else if (period === "6 AY" || period === "YIL") {
      return date
        .toLocaleDateString("tr-TR", {
          month: "short",
          year: "2-digit",
        })
        .replace(" ", "'");
    } else {
      return date.toLocaleDateString("tr-TR", {
        year: "numeric",
      });
    }
  };

  // Geçmiş verileri yükle
  const loadHistoricalData = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange(selectedPeriod);

      // TRY'den hedef para birimine geçmiş verileri çek
      // Bu bize direkt 1 CODE = X TRY formatında veri verecek
      const data = await fetchHistoricalRates(
        "TRY",
        code as string,
        start,
        end,
      );

      if (data && data.rates) {
        const dates = Object.keys(data.rates).sort();
        const rates = dates.map((date) => {
          const rateValue = data.rates[date][code as string];
          // TRY'den hedef paraya olan kur, bize 1 TRY = X CODE
          // Biz 1 CODE = X TRY istiyoruz, o yüzden 1/rateValue
          return rateValue ? 1 / rateValue : currentRate;
        });

        // Eğer veri yoksa mevcut rate'i kullan
        if (rates.length === 0) {
          setChartData({
            labels: ["Şimdi"],
            datasets: [{ data: [currentRate] }],
          });
        } else {
          // Periyoda göre optimal nokta sayısı
          const optimalPoints = getOptimalPoints(selectedPeriod);
          const step = Math.max(1, Math.floor(dates.length / optimalPoints));

          let sampledDates = [];
          let sampledRates = [];

          // İlk veriyi her zaman ekle
          sampledDates.push(dates[0]);
          sampledRates.push(rates[0]);

          // Ortadaki verileri örnekle
          for (let i = step; i < dates.length - 1; i += step) {
            sampledDates.push(dates[i]);
            sampledRates.push(rates[i]);
          }

          // Son veriyi her zaman ekle
          if (dates.length > 1) {
            sampledDates.push(dates[dates.length - 1]);
            sampledRates.push(rates[rates.length - 1]);
          }

          setChartData({
            labels: sampledDates.map((d) => formatDateLabel(d, selectedPeriod)),
            datasets: [{ data: sampledRates }],
          });
        }
      }
    } catch (error) {
      console.error("Error loading historical data:", error);
      // Hata durumunda simüle edilmiş veri kullanıcaam
      setChartData({
        labels: ["Başlangıç", "", "", "", "Şimdi"],
        datasets: [
          {
            data: [
              currentRate * 0.985,
              currentRate * 0.988,
              currentRate * 0.995,
              currentRate * 1.002,
              currentRate,
            ],
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  // Period değiştiğinde verileri yükle
  useEffect(() => {
    loadHistoricalData();
  }, [selectedPeriod]);

  const getCurrencyInfo = (currencyCode: string) => {
    const currencies: { [key: string]: { name: string; flag: string } } = {
      TRY: { name: "Türk Lirası", flag: "🇹🇷" },
      USD: { name: "Amerikan Doları", flag: "🇺🇸" },
      EUR: { name: "Euro", flag: "🇪🇺" },
      GBP: { name: "İngiliz Sterlini", flag: "🇬🇧" },
      JPY: { name: "Japon Yeni", flag: "🇯🇵" },
      CHF: { name: "İsviçre Frangı", flag: "🇨🇭" },
      AUD: { name: "Avustralya Doları", flag: "🇦🇺" },
      CAD: { name: "Kanada Doları", flag: "🇨🇦" },
      SAR: { name: "Suudi Arabistan Riyali", flag: "🇸🇦" },
    };
    return currencies[currencyCode] || { name: currencyCode, flag: "💱" };
  };

  const info = getCurrencyInfo(code as string);

  const periods = ["GÜN", "HAFTA", "AY", "6 AY", "YIL", "5 YIL", "MAX"];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#0D47A1", "#1565C0", "#1976D2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NOMISMA</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity>
            <Text style={styles.headerIcon}>↗️</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.headerIcon}>➕</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Currency Info */}
        <View style={styles.currencyInfo}>
          <Text style={styles.currencyCode}>{code}</Text>
          <Text style={styles.currencyName}>{info.name}</Text>
        </View>

        {/* Current Rate */}
        <View style={styles.rateContainer}>
          <View style={styles.rateRow}>
            <Text style={styles.rateLabel}>1 {code} = </Text>
            <Text style={styles.currentRate}>{currentRate.toFixed(4)}</Text>
            <Text style={styles.rateCurrency}> TRY</Text>
          </View>
          <View style={styles.changeContainer}>
            <Text
              style={[
                styles.changeText,
                change >= 0 ? styles.positive : styles.negative,
              ]}
            >
              {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          {loading ? (
            <View style={styles.loadingChart}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <>
              <LineChart
                data={chartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  backgroundColor: COLORS.white,
                  backgroundGradientFrom: COLORS.white,
                  backgroundGradientTo: COLORS.white,
                  decimalPlaces: 4,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "0",
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "",
                    stroke: "#e0e0e0",
                    strokeWidth: 1,
                  },
                  propsForLabels: {
                    fontSize: 9,
                  },
                }}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                segments={4}
                formatXLabel={(value) => value}
                formatYLabel={(value) => parseFloat(value).toFixed(2)}
              />

              {/* Chart Labels */}
              <View style={styles.chartLabels}>
                <View style={styles.chartLabel}>
                  <Text style={styles.chartLabelValue}>
                    {periodHigh.toFixed(4)}
                  </Text>
                  <View style={styles.chartLabelBadge}>
                    <Text style={styles.chartLabelBadgeText}>
                      {currentRate.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.chartLabel}>
                  <Text style={styles.chartLabelValue}>
                    {periodLow.toFixed(4)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Period Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.periodSelector}
          contentContainerStyle={styles.periodSelectorContent}
        >
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>{selectedPeriod.toUpperCase()}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>EN YÜKSEK</Text>
              <Text style={styles.statValue}>{periodHigh.toFixed(4)}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>EN DÜŞÜK</Text>
              <Text style={styles.statValue}>{periodLow.toFixed(4)}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>AÇILIŞ</Text>
              <Text style={styles.statValue}>{openRate.toFixed(4)}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ÖNCEKİ KAPANIŞ</Text>
              <Text style={styles.statValue}>{prevClose.toFixed(4)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingTop: 45,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 40,
  },
  backIcon: {
    fontSize: 28,
    color: COLORS.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.white,
    letterSpacing: 6,
  },
  headerActions: {
    flexDirection: "row",
    gap: 15,
  },
  headerIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  currencyInfo: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  currencyName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  rateContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    alignItems: "baseline",
  },
  rateRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  rateLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  currentRate: {
    fontSize: 42,
    fontWeight: "700",
    color: COLORS.text,
  },
  rateCurrency: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  changeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  positive: {
    color: "#4CAF50",
  },
  negative: {
    color: "#F44336",
  },
  chartContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    position: "relative",
  },
  loadingChart: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  chart: {
    borderRadius: 16,
  },
  chartLabels: {
    position: "absolute",
    right: 30,
    top: 20,
    bottom: 40,
    justifyContent: "space-between",
  },
  chartLabel: {
    alignItems: "flex-end",
  },
  chartLabelValue: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  chartLabelBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  chartLabelBadgeText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: "600",
  },
  periodSelector: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  periodSelectorContent: {
    gap: 10,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  periodButtonTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 15,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    padding: 20,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
});
