import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
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

  const handleSelectCandidateForGuided = (template: any) => {
    setGuidedInitialTemplate(template);
    setActiveTab('guided');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>ગુજરાતી હસ્તાક્ષર (Gujarati Handwriting)</Text>
            <View style={styles.badgeRow}>
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineText}>● 100% OFFLINE</Text>
              </View>
              {Platform.OS === 'web' && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = '../index.html';
                    }
                  }}
                >
                  <Text style={styles.backButtonText}>🖋️ Stroke Animator & Kano Audio</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Hybrid Recognition: Sakoe-Chiba DTW + Cross-Platform Tiny CNN
          </Text>
        </View>
      </View>

      {/* Navigation Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'guided' && styles.activeTabItem]}
          onPress={() => setActiveTab('guided')}
        >
          <Text style={[styles.tabText, activeTab === 'guided' && styles.activeTabText]}>
            ✍️ Guided
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'animated' && styles.activeTabItem]}
          onPress={() => setActiveTab('animated')}
        >
          <Text style={[styles.tabText, activeTab === 'animated' && styles.activeTabText]}>
            🎬 Animated
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'quiz' && styles.activeTabItem]}
          onPress={() => setActiveTab('quiz')}
        >
          <Text style={[styles.tabText, activeTab === 'quiz' && styles.activeTabText]}>
            🎮 Quiz Game
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'free' && styles.activeTabItem]}
          onPress={() => setActiveTab('free')}
        >
          <Text style={[styles.tabText, activeTab === 'free' && styles.activeTabText]}>
            🔍 Free Draw
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'benchmark' && styles.activeTabItem]}
          onPress={() => setActiveTab('benchmark')}
        >
          <Text style={[styles.tabText, activeTab === 'benchmark' && styles.activeTabText]}>
            ⚡ Benchmarks
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screen Container */}
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
            initialTemplate={guidedInitialTemplate}
          />
        )}
        {activeTab === 'quiz' && (
          <QuizGameScreen templates={CHARACTER_TEMPLATES} />
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
    backgroundColor: '#090d16',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  offlineText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  backButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  backButtonText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: '#0284c7',
    backgroundColor: '#1e293b',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
  },
});
