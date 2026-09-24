import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { CharacterTemplate, CharacterCategory } from '../types/handwriting';
import { speakGujarati } from '../utils/speech';

interface CharacterSelectorProps {
  templates: CharacterTemplate[];
  selectedTemplate: CharacterTemplate;
  onSelect: (template: CharacterTemplate) => void;
}

type TabCategory = 'kakko' | 'barakhadi' | 'number' | 'all';

const NUMBER_SUBTEXT_MAP: Record<string, string> = {
  '૦': '0 (śūnya)',
  '૧': '1 (ek)',
  '૨': '2 (be)',
  '૩': '3 (tra)',
  '૪': '4 (chār)',
  '૫': '5 (pāṅch)',
  '૬': '6 (chha)',
  '૭': '7 (sāt)',
  '૮': '8 (āṭh)',
  '૯': '9 (nav)',
  '૧૦': '10 (das)',
  '૨૦': '20 (vīs)',
  '૨૫': '25 (pachīs)',
  '૫૦': '50 (pachās)',
  '૭૫': '75 (pañchoter)',
  '૧૦૦': '100 (so)',
};

const CONSONANT_GROUPS: Array<{ group: string; char: string; name: string }> = [
  { group: '1_k', char: 'ક', name: 'ka' },
  { group: '2_kh', char: 'ખ', name: 'kha' },
  { group: '3_g', char: 'ગ', name: 'ga' },
  { group: '4_gh', char: 'ઘ', name: 'gha' },
  { group: '5_ch', char: 'ચ', name: 'cha' },
  { group: '6_chha', char: 'છ', name: 'chha' },
  { group: '7_j', char: 'જ', name: 'ja' },
  { group: '8_jh', char: 'ઝ', name: 'jha' },
  { group: '9_t', char: 'ટ', name: 'ta' },
  { group: '10_th', char: 'ઠ', name: 'tha' },
  { group: '11_d', char: 'ડ', name: 'da' },
  { group: '12_dh', char: 'ઢ', name: 'dha' },
  { group: '13_n', char: 'ણ', name: 'ana' },
  { group: '14_t', char: 'ત', name: 'ta' },
  { group: '15_th', char: 'થ', name: 'tha' },
  { group: '16_d', char: 'દ', name: 'da' },
  { group: '17_dh', char: 'ધ', name: 'dha' },
  { group: '18_n', char: 'ન', name: 'na' },
  { group: '19_p', char: 'પ', name: 'pa' },
  { group: '20_ph', char: 'ફ', name: 'pha' },
  { group: '21_b', char: 'બ', name: 'ba' },
  { group: '22_bh', char: 'ભ', name: 'bha' },
  { group: '23_m', char: 'મ', name: 'ma' },
  { group: '24_y', char: 'ય', name: 'ya' },
  { group: '25_r', char: 'ર', name: 'ra' },
  { group: '26_l', char: 'લ', name: 'la' },
  { group: '27_v', char: 'વ', name: 'va' },
  { group: '28_sh', char: 'શ', name: 'sha' },
  { group: '29_ss', char: 'ષ', name: 'ssa' },
  { group: '30_s', char: 'સ', name: 'sa' },
  { group: '31_h', char: 'હ', name: 'ha' },
  { group: '32_l', char: 'ળ', name: 'la' },
  { group: '33_ksh', char: 'ક્ષ', name: 'ksha' },
  { group: '34_gn', char: 'જ્ઞ', name: 'gya' },
];

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  templates,
  selectedTemplate,
  onSelect,
}) => {
  const [activeCategory, setActiveCategory] = useState<TabCategory>('kakko');
  const [currentConsonantGroup, setCurrentConsonantGroup] = useState<string>('1_k');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Counts
  const counts = useMemo(() => {
    let kakko = 0;
    let barakhadi = 0;
    let number = 0;
    templates.forEach(t => {
      if (t.category === 'vowel' || t.category === 'consonant') kakko++;
      else if (t.category === 'barakhadi') barakhadi++;
      else if (t.category === 'number') number++;
    });
    return { kakko, barakhadi, number, all: templates.length };
  }, [templates]);

  const categories: Array<{ id: TabCategory; label: string; count: number }> = [
    { id: 'kakko', label: 'કક્કો Kakko', count: counts.kakko },
    { id: 'barakhadi', label: 'બારાખડી Barakhadi', count: counts.barakhadi },
    { id: 'number', label: 'આંકડા Numbers 0-100', count: counts.number },
    { id: 'all', label: 'All Characters', count: counts.all },
  ];

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return templates.filter(t => {
        const gujaratiMatch = t.gujarati && t.gujarati.includes(q);
        const nameMatch = t.name && t.name.toLowerCase().includes(q);
        const transMatch = t.transliteration && t.transliteration.toLowerCase().includes(q);
        const idMatch = t.id && t.id.toLowerCase().includes(q);
        return gujaratiMatch || nameMatch || transMatch || idMatch;
      });
    }

    if (activeCategory === 'kakko') {
      return templates.filter(t => t.category === 'vowel' || t.category === 'consonant');
    }
    if (activeCategory === 'barakhadi') {
      return templates.filter(
        t => t.category === 'barakhadi' && t.id.includes(`_${currentConsonantGroup}_`)
      );
    }
    if (activeCategory === 'number') {
      return templates.filter(t => t.category === 'number');
    }
    return templates;
  }, [templates, activeCategory, currentConsonantGroup, searchQuery]);

  const handleCardClick = (tmpl: CharacterTemplate) => {
    onSelect(tmpl);
    speakGujarati(tmpl.gujarati, tmpl.transliteration);
  };

  return (
    <View style={styles.container}>
      {/* Catalog Toolbar: Category Tabs (Left) + Search Box (Right) */}
      <View style={styles.toolbar}>
        {/* Category Tabs */}
        <View style={styles.categoryTabs}>
          {categories.map(cat => {
            const isActive = activeCategory === cat.id && !searchQuery;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catTab, isActive && styles.catTabActive]}
                onPress={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery('');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.catTabText, isActive && styles.catTabTextActive]}>
                  {cat.label}
                </Text>
                <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                  <Text style={styles.countText}>{cat.count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Search Box */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[
              styles.searchInput,
              Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
            ]}
            placeholder="Search character, English sound, or number..."
            placeholderTextColor="#6e7681"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Barakhadi Consonant Sub-Bar (Appears when Barakhadi tab is active and not searching) */}
      {activeCategory === 'barakhadi' && !searchQuery && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.barakhadiBar}
          contentContainerStyle={styles.barakhadiBarContent}
        >
          {CONSONANT_GROUPS.map(g => {
            const isActive = currentConsonantGroup === g.group;
            return (
              <TouchableOpacity
                key={g.group}
                style={[styles.consonantChip, isActive && styles.consonantChipActive]}
                onPress={() => setCurrentConsonantGroup(g.group)}
                activeOpacity={0.7}
              >
                <Text style={[styles.consonantChipText, isActive && styles.consonantChipTextActive]}>
                  {g.char}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Characters Grid - Exact 72x76px cards matching Section 1 */}
      <ScrollView
        style={[
          styles.gridScrollView,
          Platform.OS === 'web' && ({ maxHeight: 480, overflowY: 'auto' } as any),
        ]}
        contentContainerStyle={styles.charGrid}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
      >
        {filteredTemplates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No characters match "{searchQuery}"</Text>
          </View>
        ) : (
          filteredTemplates.map(tmpl => {
            const isSelected = tmpl.id === selectedTemplate?.id;
            let subText = tmpl.transliteration || tmpl.name;
            if (tmpl.category === 'number' && NUMBER_SUBTEXT_MAP[tmpl.gujarati]) {
              subText = NUMBER_SUBTEXT_MAP[tmpl.gujarati];
            }

            return (
              <TouchableOpacity
                key={tmpl.id}
                style={[styles.charBtn, isSelected && styles.charBtnActive]}
                onPress={() => handleCardClick(tmpl)}
                activeOpacity={0.7}
              >
                <Text style={[styles.soundIndicator, isSelected && styles.soundIndicatorActive]}>
                  🔊
                </Text>
                <Text style={[styles.charGlyph, isSelected && styles.charGlyphActive]}>
                  {tmpl.gujarati}
                </Text>
                <Text
                  style={[styles.charSub, isSelected && styles.charSubActive]}
                  numberOfLines={1}
                >
                  {subText}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  /* Toolbar */
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },

  categoryTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },

  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
  },

  catTabActive: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
    shadowColor: '#ff6b35',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 4,
  },

  catTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b949e',
  },

  catTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  countBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
  },

  countBadgeActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },

  countText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
  },

  /* Search Box */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 9999,
    paddingHorizontal: 14,
    height: 38,
    minWidth: 260,
    flex: 1,
    maxWidth: 360,
  },

  searchIcon: {
    fontSize: 14,
    marginRight: 8,
    color: '#8b949e',
  },

  searchInput: {
    flex: 1,
    color: '#f0f6fc',
    fontSize: 13,
    padding: 0,
  },

  clearSearchText: {
    color: '#8b949e',
    fontSize: 14,
    paddingHorizontal: 4,
  },

  /* Barakhadi Consonant Sub-Bar */
  barakhadiBar: {
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
    marginBottom: 14,
    paddingBottom: 8,
  },

  barakhadiBarContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },

  consonantChip: {
    width: 38,
    height: 38,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  consonantChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
    shadowColor: '#0284c7',
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },

  consonantChipText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },

  consonantChipTextActive: {
    color: '#ffffff',
  },

  /* Grid Scroll View */
  gridScrollView: {
    width: '100%',
    maxHeight: 480,
  },

  charGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 4,
    alignItems: 'flex-start',
  },

  /* Character Card - Exact 72x76px matching Section 1 */
  charBtn: {
    width: 72,
    height: 76,
    backgroundColor: '#141c28',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    position: 'relative',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },

  charBtnActive: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
    shadowColor: '#ff6b35',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 6,
    transform: [{ translateY: -2 }],
  },

  soundIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 8,
    opacity: 0.35,
  },

  soundIndicatorActive: {
    opacity: 1,
  },

  charGlyph: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 28,
  },

  charGlyphActive: {
    color: '#ffffff',
  },

  charSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
    maxWidth: 62,
  },

  charSubActive: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
  },

  emptyState: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },

  emptyIcon: {
    fontSize: 28,
  },

  emptyText: {
    color: '#8b949e',
    fontSize: 13,
  },
});
