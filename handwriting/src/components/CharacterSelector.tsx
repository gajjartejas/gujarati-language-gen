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
      <View style={styles.categoryContainer}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryPill,
              activeCategory === cat.id && styles.activeCategoryPill,
            ]}
            onPress={() => setActiveCategory(cat.id)}
            activeOpacity={0.7}
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
      </View>

      {/* Characters Grid - All alphabets visible, wrapped, no scrolling */}
      <View style={styles.charGrid}>
        {filteredTemplates.map(tmpl => {
          const isSelected = tmpl.id === selectedTemplate?.id;
          return (
            <TouchableOpacity
              key={tmpl.id}
              style={[styles.charCard, isSelected && styles.activeCharCard]}
              onPress={() => onSelect(tmpl)}
              activeOpacity={0.7}
            >
              <Text style={[styles.charText, isSelected && styles.activeCharText]}>
                {tmpl.gujarati}
              </Text>
              <Text style={[styles.charSub, isSelected && styles.activeCharSub]}>
                {tmpl.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 12,
    fontWeight: '600',
  },
  activeCategoryText: {
    color: '#ffffff',
  },
  charGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
    width: '100%',
  },
  charCard: {
    width: 44,
    height: 48,
    backgroundColor: '#141c28',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 2,
  },
  activeCharCard: {
    backgroundColor: '#0c4a6e',
    borderColor: '#38bdf8',
    borderWidth: 2,
    shadowColor: '#38bdf8',
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  charText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
    lineHeight: 23,
  },
  activeCharText: {
    color: '#38bdf8',
  },
  charSub: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 1,
  },
  activeCharSub: {
    color: '#bae6fd',
    fontWeight: '700',
  },
});
