import BottomNavigation from '@/components/BottomNavigation';
import { COLORS } from '@/constants/theme';
import { fetchExchangeRates } from '@/services/api';
import { ExchangeRates } from '@/types/currency';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ConverterScreen() {
  const router = useRouter();
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [fromCurrency, setFromCurrency] = useState('TRY');
  const [toCurrency, setToCurrency] = useState('USD');
  const [fromAmount, setFromAmount] = useState('4000');
  const [toAmount, setToAmount] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showFromInputPicker, setShowFromInputPicker] = useState(false);
  const [showToInputPicker, setShowToInputPicker] = useState(false);

  const currencyNames: { [key: string]: { name: string; flag: string } } = {
    'TRY': { name: 'Türk Lirası', flag: '🇹🇷' },
    'USD': { name: 'Amerikan Doları', flag: '🇺🇸' },
    'EUR': { name: 'Avrupa Eurosu', flag: '🇪🇺' },
    'GBP': { name: 'İngiliz Sterlini', flag: '🇬🇧' },
    'JPY': { name: 'Japon Yeni', flag: '🇯🇵' },
    'CHF': { name: 'İsviçre Frangı', flag: '🇨🇭' },
    'AUD': { name: 'Avustralya Doları', flag: '🇦🇺' },
    'CAD': { name: 'Kanada Doları', flag: '🇨🇦' },
    'SAR': { name: 'Suudi Arabistan Riyali', flag: '🇸🇦' },
    'CNY': { name: 'Çin Yuanı', flag: '🇨🇳' },
    'BRL': { name: 'Brezilya Reali', flag: '🇧🇷' },
    'CZK': { name: 'Çek Korunası', flag: '🇨🇿' },
    'DKK': { name: 'Danimarka Kronu', flag: '🇩🇰' },
    'HUF': { name: 'Macar Forinti', flag: '🇭🇺' },
    'INR': { name: 'Hint Rupisi', flag: '🇮🇳' },
    'KRW': { name: 'Güney Kore Wonu', flag: '🇰🇷' },
    'MXN': { name: 'Meksika Pesosu', flag: '🇲🇽' },
    'NOK': { name: 'Norveç Kronu', flag: '🇳🇴' },
    'NZD': { name: 'Yeni Zelanda Doları', flag: '🇳🇿' },
    'PLN': { name: 'Polonya Zlotisi', flag: '🇵🇱' },
    'RON': { name: 'Romen Leyi', flag: '🇷🇴' },
    'RUB': { name: 'Rus Rublesi', flag: '🇷🇺' },
    'SEK': { name: 'İsveç Kronu', flag: '🇸🇪' },
    'SGD': { name: 'Singapur Doları', flag: '🇸🇬' },
    'THB': { name: 'Tayland Bahtı', flag: '🇹🇭' },
    'ZAR': { name: 'Güney Afrika Randı', flag: '🇿🇦' },
  };

  const getAvailableCurrencies = () => {
    if (!rates) {
      console.log('Rates is null, returning empty array');
      return [];
    }
    
    console.log('Rates object:', rates);
    const availableCodes = ['TRY', 'CHF', ...Object.keys(rates.rates)];
    console.log('Available codes:', availableCodes);
    
    return availableCodes
      .filter((code, index, self) => self.indexOf(code) === index) // Remove duplicates
      .sort()
      .map(code => ({
        code,
        name: currencyNames[code]?.name || code,
        flag: currencyNames[code]?.flag || '💱'
      }));
  };

  useEffect(() => {
    loadRates();
  }, []);

  useEffect(() => {
    if (rates && fromAmount) {
      convertCurrency(fromAmount, fromCurrency, toCurrency);
    }
  }, [fromAmount, fromCurrency, toCurrency, rates]);

  const loadRates = async () => {
    try {
      setLoading(true);
      const data = await fetchExchangeRates('CHF');
      console.log('Rates loaded:', data);
      setRates(data);
      // İlk yükleme sonrası dönüşüm yap
      if (data && fromAmount) {
        convertCurrency(fromAmount, fromCurrency, toCurrency);
      }
    } catch (error) {
      console.error('Error loading rates:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const convertCurrency = (amount: string, from: string, to: string) => {
    if (!rates || !amount || amount === '0') {
      console.log('Convert failed: rates or amount missing');
      setToAmount('');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      setToAmount('');
      return;
    }

    // CHF bazlı API kullandığımız için dönüşüm
    const fromRate = from === 'CHF' ? 1 : (rates.rates[from] || 1);
    const toRate = to === 'CHF' ? 1 : (rates.rates[to] || 1);
    const tryRate = rates.rates['TRY'] || 35; // Fallback değer

    console.log(`Converting ${numAmount} ${from} to ${to}`);
    console.log(`Rates - from: ${fromRate}, to: ${toRate}, TRY: ${tryRate}`);

    let result: number;

    if (from === 'TRY') {
      // TRY'den diğer para birimine
      const chfAmount = numAmount / tryRate;
      result = to === 'CHF' ? chfAmount : chfAmount * toRate;
    } else if (to === 'TRY') {
      // Diğer para biriminden TRY'ye
      const chfAmount = from === 'CHF' ? numAmount : numAmount / fromRate;
      result = chfAmount * tryRate;
    } else {
      // İki yabancı para birimi arası
      const chfAmount = from === 'CHF' ? numAmount : numAmount / fromRate;
      result = to === 'CHF' ? chfAmount : chfAmount * toRate;
    }

    console.log(`Result: ${result.toFixed(2)}`);
    setToAmount(result.toFixed(2));
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
  };

  const getCurrencyInfo = (code: string) => {
    return {
      code,
      name: currencyNames[code]?.name || code,
      flag: currencyNames[code]?.flag || '💱'
    };
  };

  const getExchangeRate = () => {
    if (!rates || !fromAmount || fromAmount === '0') return '0.00';
    
    const numAmount = parseFloat(fromAmount);
    const numToAmount = parseFloat(toAmount);
    
    if (isNaN(numAmount) || isNaN(numToAmount) || numAmount === 0) return '0.00';
    
    return (numToAmount / numAmount).toFixed(4);
  };

  const fromInfo = getCurrencyInfo(fromCurrency);
  const toInfo = getCurrencyInfo(toCurrency);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Çevirici</Text>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Çevirici</Text>
        <View style={styles.headerActions} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <View style={[styles.tab, styles.tabActive]}>
          <Text style={styles.tabTextActive}>DÖVİZ</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Currency Selection Card */}
        <View style={styles.selectionCard}>
          <TouchableOpacity 
            style={styles.currencySelect}
            onPress={() => setShowFromPicker(!showFromPicker)}
          >
            <Text style={styles.currencySelectCode}>{fromCurrency}</Text>
            <Text style={styles.currencySelectName}>{fromInfo.name}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.swapButton} onPress={swapCurrencies}>
            <Text style={styles.swapIcon}>⇄</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.currencySelect}
            onPress={() => setShowToPicker(!showToPicker)}
          >
            <Text style={styles.currencySelectCode}>{toCurrency}</Text>
            <Text style={styles.currencySelectName}>{toInfo.name}</Text>
          </TouchableOpacity>
        </View>

        {/* From Currency Picker */}
        {showFromPicker && (
          <View style={styles.pickerContainer}>
            <ScrollView style={styles.picker}>
              {getAvailableCurrencies().map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={styles.pickerItem}
                  onPress={() => {
                    setFromCurrency(currency.code);
                    setShowFromPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemFlag}>{currency.flag}</Text>
                  <View>
                    <Text style={styles.pickerItemCode}>{currency.code}</Text>
                    <Text style={styles.pickerItemName}>{currency.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* To Currency Picker */}
        {showToPicker && (
          <View style={styles.pickerContainer}>
            <ScrollView style={styles.picker}>
              {getAvailableCurrencies().map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={styles.pickerItem}
                  onPress={() => {
                    setToCurrency(currency.code);
                    setShowToPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemFlag}>{currency.flag}</Text>
                  <View>
                    <Text style={styles.pickerItemCode}>{currency.code}</Text>
                    <Text style={styles.pickerItemName}>{currency.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Secondary Selection */}
        <View style={styles.secondarySelection}>
          <View style={styles.secondaryItem}>
            <Text style={styles.secondaryCode}>{fromCurrency}</Text>
            <Text style={styles.secondaryName}>{fromInfo.name}</Text>
          </View>
          <View style={styles.dividerVertical} />
          <View style={styles.secondaryItem}>
            <Text style={styles.secondaryCode}>{toCurrency}</Text>
            <Text style={styles.secondaryName}>{toInfo.name}</Text>
          </View>
        </View>

        {/* Exchange Rate */}
        <View style={styles.rateDisplay}>
          <Text style={styles.rateText}>{getExchangeRate()}</Text>
        </View>

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <View style={styles.inputBox}>
            <TouchableOpacity 
              style={styles.currencyButton}
              onPress={() => {
                console.log('From currency button pressed');
                setShowFromInputPicker(!showFromInputPicker);
              }}
            >
              <Text style={styles.currencyButtonText}>{fromCurrency} ▼</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={fromAmount}
              onChangeText={setFromAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#ccc"
            />
            <Text style={styles.inputLabel}>{fromCurrency}</Text>
          </View>

          <View style={styles.inputBox}>
            <TouchableOpacity 
              style={styles.currencyButton}
              onPress={() => {
                console.log('To currency button pressed');
                setShowToInputPicker(!showToInputPicker);
              }}
            >
              <Text style={styles.currencyButtonText}>{toCurrency} ▼</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={toAmount}
              onChangeText={(value) => {
                setToAmount(value);
                if (value && !isNaN(parseFloat(value))) {
                  convertCurrency(value, toCurrency, fromCurrency);
                  setFromAmount((parseFloat(value) * (1 / parseFloat(getExchangeRate()))).toFixed(2));
                }
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#ccc"
            />
            <Text style={styles.inputLabel}>{toCurrency}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Ortak Para Birimi Seçici Modal */}
      <Modal
        visible={showFromInputPicker || showToInputPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowFromInputPicker(false);
          setShowToInputPicker(false);
        }}
      >
        <TouchableOpacity 
          style={styles.pickerBackdrop} 
          activeOpacity={1} 
          onPress={() => {
            setShowFromInputPicker(false);
            setShowToInputPicker(false);
          }}
        >
          <View style={styles.inputPickerContainer}>
            <Text style={styles.pickerHeaderTitle}>Para Birimi Seçin</Text>
            <ScrollView style={{ width: '100%' }}>
              {getAvailableCurrencies().map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={styles.inputPickerItem}
                  onPress={() => {
                    if (showFromInputPicker) setFromCurrency(currency.code);
                    else setToCurrency(currency.code);
                    
                    setShowFromInputPicker(false);
                    setShowToInputPicker(false);
                  }}
                >
                  <Text style={styles.inputPickerFlag}>{currency.flag}</Text>
                  <View>
                    <Text style={styles.inputPickerCode}>{currency.code}</Text>
                    <Text style={styles.inputPickerName}>{currency.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 45,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 28,
    color: COLORS.white,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: '600',
    letterSpacing: 2,
  },
  headerActions: {
    width: 28,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    letterSpacing: 1,
  },
  tabTextActive: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A8E6CF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
  },
  currencySelect: {
    flex: 1,
  },
  currencySelectCode: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
  },
  currencySelectName: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 4,
  },
  swapButton: {
    backgroundColor: COLORS.white,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  swapIcon: {
    fontSize: 24,
    color: '#4CAF50',
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  picker: {
    flex: 1,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerItemFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  pickerItemCode: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  pickerItemName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  secondarySelection: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
  },
  secondaryItem: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  secondaryCode: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  secondaryName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  rateDisplay: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  rateText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  inputContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 30,
    gap: 15,
  },
  inputBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 20,
  },
  currencyButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  input: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputPickerContainer: {
    backgroundColor: COLORS.white,
    width: '85%',
    maxHeight: '70%',
    borderRadius: 20,
    paddingVertical: 10,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  pickerHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    color: COLORS.primary,
  },
  inputPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  inputPickerFlag: {
    fontSize: 28,
    marginRight: 15,
  },
  inputPickerCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  inputPickerName: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
