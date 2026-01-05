import { COLORS } from '@/constants/theme';
import { usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.push('/')}
      >
        <Text style={[styles.navIcon, pathname === '/' && styles.navActive]}>🌍</Text>
        <Text style={[styles.navText, pathname === '/' && styles.navActive]}>Döviz</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.push('/cevirici')}
      >
        <Text style={[styles.navIcon, pathname === '/cevirici' && styles.navActive]}>🔄</Text>
        <Text style={[styles.navText, pathname === '/cevirici' && styles.navActive]}>Çevirici</Text>
      </TouchableOpacity>
    </View>
  );
}

// Stilleri dışa aktarabilirsin (export), ama yukarıda aynı isimde import olmamalı
export const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
    opacity: 0.5,
  },
  navText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  navActive: {
    opacity: 1,
    color: COLORS.primary,
  },
});