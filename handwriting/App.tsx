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
  const [isEmbedded, setIsEmbedded] = useState<boolean>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        return window.self !== window.top || window.location.search.includes('embedded=true');
      } catch (e) {
        return true;
      }
    }
    return false;
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        setIsEmbedded(window.self !== window.top || window.location.search.includes('embedded=true'));
      } catch (e) {
        setIsEmbedded(true);
      }

      // Inject full-height reset on web without 100% viewport forcing
      const styleId = 'handwriting-web-fullheight-fix';
      if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = `
          html, body {
            height: auto !important;
            min-height: 0 !important;
            overflow-y: visible !important;
            overflow-x: hidden !important;
            background-color: #0a0e14 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #root {
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
            overflow-y: visible !important;
          }
          /* Prevent React Native Web ScrollView inner container from forcing 100% height */
          div[style*="min-height: 100%"] {
            min-height: 0 !important;
          }
          /* Hide scrollbars inside React Native Web ScrollViews */
          div[style*="overflow-y: auto"], div[style*="overflow-y: scroll"] {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          div[style*="overflow-y: auto"]::-webkit-scrollbar, div[style*="overflow-y: scroll"]::-webkit-scrollbar {
            display: none !important;
          }
        `;
        document.head.appendChild(styleEl);
      }

      // Measure exact content scroll height (prevents infinite expansion loop)
      let lastReportedHeight = 0;
      const sendHeight = () => {
        const el = document.getElementById('handwriting-app-content');
        if (!el) return;
        // Use scrollHeight which reflects true content height rather than window stretch
        const h = Math.ceil(Math.max(el.scrollHeight, el.offsetHeight));
        if (h > 300 && Math.abs(h - lastReportedHeight) >= 8) {
          lastReportedHeight = h;
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'HANDWRITING_RESIZE', height: h }, '*');
          }
        }
      };

      sendHeight();
      const t1 = setTimeout(sendHeight, 100);
      const t2 = setTimeout(sendHeight, 400);

      const onMsg = (e: MessageEvent) => {
        if (!e.data) return;
        if (e.data.type === 'REQUEST_HEIGHT') {
          lastReportedHeight = 0;
          sendHeight();
        } else if (e.data.type === 'SELECT_CHARACTER') {
          let found: any = undefined;
          if (e.data.ref_svg) {
            const m = e.data.ref_svg.match(/assets\/svgs\/ref\/(.*)\.svg/);
            if (m) {
              const derivedId = m[1].replace(/\//g, '_');
              found = CHARACTER_TEMPLATES.find(t => t.id === derivedId);
            }
          }
          if (!found && e.data.char) {
            found = CHARACTER_TEMPLATES.find(t => t.gujarati === e.data.char);
          }
          if (!found && e.data.id) {
            found = CHARACTER_TEMPLATES.find(t => t.id === e.data.id);
          }
          if (!found && e.data.char) {
            const firstGlyph = e.data.char.charAt(0);
            found = CHARACTER_TEMPLATES.find(t => t.gujarati === firstGlyph);
          }
          if (found) {
            const customTemplate = {
              ...found,
              gujarati: e.data.char || found.gujarati,
              name: e.data.name || found.name,
              category: e.data.category || found.category,
            };
            setGuidedInitialTemplate(customTemplate);
            setTimeout(sendHeight, 150);
          }
        }
      };
      window.addEventListener('message', onMsg);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        window.removeEventListener('message', onMsg);
      };
    }
  }, [activeTab]);

  const handleSelectCandidateForGuided = (template: any) => {
    setGuidedInitialTemplate(template);
    setActiveTab('guided');
  };

  return (
    <View
      nativeID="handwriting-app-content"
      style={[
        styles.safeArea,
        Platform.OS === 'web' && ({
          height: 'auto',
          minHeight: 0,
          flex: 'none',
        } as any),
      ]}
    >
      <ExpoStatusBar style="light" />

      {/* Standalone Header (hidden when embedded in parent suite) */}
      {!isEmbedded && (
        <View style={styles.header}>
          {Platform.OS === 'web' && (
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
                <Text style={styles.suiteTabInactiveText}>Stroke Animator & Kano Audio</Text>
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
      )}

      {/* Feature Mode Tabs (Wrapped clean chip bar) */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBarContainer}>
          <TouchableOpacity
            style={[styles.chipTab, activeTab === 'guided' && styles.chipTabActive]}
            onPress={() => setActiveTab('guided')}
            activeOpacity={0.7}
          >
            <Text style={styles.chipTabIcon}>✍️</Text>
            <Text style={[styles.chipTabText, activeTab === 'guided' && styles.chipTabTextActive]}>
              Guided Practice
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipTab, activeTab === 'animated' && styles.chipTabActive]}
            onPress={() => setActiveTab('animated')}
            activeOpacity={0.7}
          >
            <Text style={styles.chipTabIcon}>🎬</Text>
            <Text style={[styles.chipTabText, activeTab === 'animated' && styles.chipTabTextActive]}>
              Animated Player
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipTab, activeTab === 'quiz' && styles.chipTabActive]}
            onPress={() => setActiveTab('quiz')}
            activeOpacity={0.7}
          >
            <Text style={styles.chipTabIcon}>🎮</Text>
            <Text style={[styles.chipTabText, activeTab === 'quiz' && styles.chipTabTextActive]}>
              Quiz Game
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipTab, activeTab === 'free' && styles.chipTabActive]}
            onPress={() => setActiveTab('free')}
            activeOpacity={0.7}
          >
            <Text style={styles.chipTabIcon}>🔍</Text>
            <Text style={[styles.chipTabText, activeTab === 'free' && styles.chipTabTextActive]}>
              Free Draw & ML
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipTab, activeTab === 'benchmark' && styles.chipTabActive]}
            onPress={() => setActiveTab('benchmark')}
            activeOpacity={0.7}
          >
            <Text style={styles.chipTabIcon}>⚡</Text>
            <Text style={[styles.chipTabText, activeTab === 'benchmark' && styles.chipTabTextActive]}>
              Benchmarks
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Screen View */}
      <View style={styles.contentContainer}>
        {activeTab === 'guided' && (
          <GuidedPracticeScreen
            templates={CHARACTER_TEMPLATES}
            initialTemplate={guidedInitialTemplate}
            isEmbedded={isEmbedded}
          />
        )}
        {activeTab === 'animated' && (
          <AnimatedDrawingScreen
            templates={CHARACTER_TEMPLATES}
            initialTemplate={guidedInitialTemplate}
            isEmbedded={isEmbedded}
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
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0a0e14',
    width: '100%',
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
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tabBarContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
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
    width: '100%',
    ...(Platform.OS === 'web' ? { flex: 0 } : { flex: 1 }),
  },
});
