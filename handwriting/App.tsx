import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { CHARACTER_TEMPLATES } from './src/data/characters';
import { GuidedPracticeScreen } from './src/screens/GuidedPracticeScreen';
import { AnimatedDrawingScreen } from './src/screens/AnimatedDrawingScreen';
import { QuizGameScreen } from './src/screens/QuizGameScreen';
import { FreeDrawingScreen } from './src/screens/FreeDrawingScreen';
import { BenchmarkScreen } from './src/screens/BenchmarkScreen';

type ActiveTab = 'guided' | 'animated' | 'quiz' | 'free' | 'benchmark';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('guided');
  const [guidedInitialTemplate, setGuidedInitialTemplate] = useState<any>(undefined);
  const [isEmbedded, setIsEmbedded] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        setIsEmbedded(window.self !== window.top);
      } catch (e) {
        setIsEmbedded(true);
      }
    }
  }, []);

  const handleSelectCandidateForGuided = (template: any) => {
    setGuidedInitialTemplate(template);
    setActiveTab('guided');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" />

      {/* Top Header */}
      <View style={styles.header}>
        {/* If viewed standalone (not embedded in docs/index.html), show the unified two-tab switcher */}
        {!isEmbedded && Platform.OS === 'web' && (
          <View style={styles.suiteTabsRow}>
            <TouchableOpacity
              style={styles.suiteTabInactive}
              onPress={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '../index.html';
                }
              }}
            >
              <Text style={styles.suiteTabInactiveIcon}>🖋️</Text>
              <Text style={styles.suiteTabInactiveText}>Stroke Animator & Audio</Text>
            </TouchableOpacity>

            <View style={styles.suiteTabActive}>
              <Text style={styles.suiteTabActiveIcon}>✍️</Text>
              <Text style={styles.suiteTabActiveText}>Handwriting Recognition</Text>
            </View>
          </View>
        )}

        <View style={styles.titleRow}>
          <View style={styles.titleInfo}>
            <View style={styles.mainTitleBadge}>
              <Text style={styles.headerTitle}>ગુજરાતી હસ્તાક્ષર</Text>
              <Text style={styles.headerTitleSub}>(Gujarati Handwriting)</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Hybrid DTW + Cross-Platform Tiny CNN Engine
            </Text>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineDot}>●</Text>
              <Text style={styles.offlineText}>100% OFFLINE</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Feature Mode Tabs (Scrollable pill chips on mobile) */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          <TouchableOpacity
            style={[styles.chipTab, activeTab === 'guided' && styles.chipTabActive]}
            onPress={() => setActiveTab('guided')}
          >
            <Text style={styles.chipTabIcon}>✍️</Text>
            <Text style={[styles.chipTabText, activeTab === 'guided' && styles.chipTabTextActive]}>
              Guided Practice
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipTab, activeTab === 'animated' && styles.chipTabActive]}
            onPress={() => setActiveTab('animated')}
          >
            <Text style={styles.chipTabIcon}>🎬</Text>
            <Text style={[styles.chipTabText, activeTab === 'animated' && styles.chipTabTextActive]}>
              Animated Player
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipTab, activeTab === 'quiz' && styles.chipTabActive]}
            onPress={() => setActiveTab('quiz')}
          >
            <Text style={styles.chipTabIcon}>🎮</Text>
            <Text style={[styles.chipTabText, activeTab === 'quiz' && styles.chipTabTextActive]}>
              Quiz Game
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipTab, activeTab === 'free' && styles.chipTabActive]}
            onPress={() => setActiveTab('free')}
          >
            <Text style={styles.chipTabIcon}>🔍</Text>
            <Text style={[styles.chipTabText, activeTab === 'free' && styles.chipTabTextActive]}>
              Free Draw & ML
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipTab, activeTab === 'benchmark' && styles.chipTabActive]}
            onPress={() => setActiveTab('benchmark')}
          >
            <Text style={styles.chipTabIcon}>⚡</Text>
            <Text style={[styles.chipTabText, activeTab === 'benchmark' && styles.chipTabTextActive]}>
              Benchmarks
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Active Screen View */}
      <View style={styles.contentContainer}>
        {activeTab === 'guided' && (
          <GuidedPracticeScreen
            templates={CHARACTER_TEMPLATES}
            initialTemplate={guidedInitialTemplate}
          />
        )}
        {activeTab === 'animated' && (
          <AnimatedDrawingScreen
            templates={CHARACTER_TEMPLATES}
            onSelectForGuided={handleSelectCandidateForGuided}
          />
        )}
        {activeTab === 'quiz' && (
          <QuizGameScreen
            templates={CHARACTER_TEMPLATES}
            onSelectTemplate={handleSelectCandidateForGuided}
          />
        )}
        {activeTab === 'free' && (
          <FreeDrawingScreen
            templates={CHARACTER_TEMPLATES}
            onSelectCandidate={handleSelectCandidateForGuided}
          />
        )}
        {activeTab === 'benchmark' && (
          <BenchmarkScreen templates={CHARACTER_TEMPLATES} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0e14',
  },
  header: {
    backgroundColor: '#121820',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  suiteTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    padding: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'flex-start',
  },
  suiteTabActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    shadowColor: '#0284c7',
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  suiteTabActiveIcon: {
    fontSize: 14,
  },
  suiteTabActiveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  suiteTabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  suiteTabInactiveIcon: {
    fontSize: 14,
  },
  suiteTabInactiveText: {
    color: '#8b949e',
    fontSize: 12,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  titleInfo: {
    flex: 1,
    minWidth: 200,
  },
  mainTitleBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f0f6fc',
    letterSpacing: -0.2,
  },
  headerTitleSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8b949e',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  offlineDot: {
    color: '#4ade80',
    fontSize: 9,
  },
  offlineText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tabBarWrapper: {
    backgroundColor: '#0a0e14',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBarScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipTabActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
    shadowColor: '#0284c7',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  chipTabIcon: {
    fontSize: 14,
  },
  chipTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b949e',
  },
  chipTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
  },
});
