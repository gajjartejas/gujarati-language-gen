import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { CharacterTemplate, CharacterCategory } from '../types/handwriting';

interface CharacterSelectorProps {
  templates: CharacterTemplate[];
  selectedTemplate: CharacterTemplate;
  onSelect: (template: CharacterTemplate) => void;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  templates,
  selectedTemplate,
  onSelect,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | CharacterCategory>('consonant');

  const categories: Array<{ id: 'all' | CharacterCategory; label: string }> = [
    { id: 'consonant', label: 'Consonants (વ્યંજન)' },
    { id: 'vowel', label: 'Vowels (સ્વર)' },
    { id: 'number', label: 'Numbers (અંક)' },
    { id: 'all', label: 'All Kakko' },
  ];

  const filteredTemplates =
    activeCategory === 'all'
      ? templates.filter(t => t.category === 'vowel' || t.category === 'consonant')
      : templates.filter(t => t.category === activeCategory);

  return (
    <View style={styles.container}>
      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryPill,
              activeCategory === cat.id && styles.activeCategoryPill,
            ]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === cat.id && styles.activeCategoryText,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Characters Carousel / Grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.charScroll}
      >
        {filteredTemplates.slice(0, 36).map(tmpl => {
          const isSelected = tmpl.id === selectedTemplate?.id;
          return (
            <TouchableOpacity
              key={tmpl.id}
              style={[styles.charCard, isSelected && styles.activeCharCard]}
              onPress={() => onSelect(tmpl)}
            >
              <Text style={[styles.charText, isSelected && styles.activeCharText]}>
                {tmpl.gujarati}
              </Text>
              <Text style={styles.charSub}>{tmpl.name}</Text>
              <Text style={styles.strokeCountBadge}>{tmpl.strokeCount} strk</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  categoryScroll: {
    paddingHorizontal: 4,
    gap: 8,
    marginBottom: 10,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeCategoryPill: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  categoryText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  activeCategoryText: {
    color: '#ffffff',
  },
  charScroll: {
    paddingHorizontal: 4,
    gap: 10,
  },
  charCard: {
    width: 68,
    height: 80,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeCharCard: {
    backgroundColor: '#0c4a6e',
    borderColor: '#38bdf8',
    borderWidth: 2,
  },
  charText: {
    fontSize: 26,
    color: '#f8fafc',
    fontWeight: '700',
  },
  activeCharText: {
    color: '#38bdf8',
  },
  charSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  strokeCountBadge: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
  },
});
