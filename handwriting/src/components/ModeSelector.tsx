import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type ActiveTab = 'guided' | 'animated' | 'quiz' | 'free' | 'benchmark';

interface ModeSelectorProps {
  activeTab?: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
}

const MODES: { id: ActiveTab; icon: string; label: string }[] = [
  { id: 'guided', icon: '✍️', label: 'Guided Practice' },
  { id: 'animated', icon: '🎬', label: 'Animated Player' },
  { id: 'quiz', icon: '🎮', label: 'Quiz Game' },
  { id: 'free', icon: '🔍', label: 'Free Draw & ML' },
  { id: 'benchmark', icon: '⚡', label: 'Benchmarks' },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  activeTab = 'guided',
  onSelectTab,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>PRACTICE MODE</Text>
      <View style={styles.grid}>
        {MODES.map((m) => {
          const isActive = activeTab === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelectTab && onSelectTab(m.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{m.icon}</Text>
              <Text style={[styles.text, isActive && styles.textActive]}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8b949e',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
    shadowColor: '#0284c7',
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  icon: {
    fontSize: 12,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8b949e',
  },
  textActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
