import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { CharacterTemplate } from '../types/handwriting';

interface WorksheetModalProps {
  visible: boolean;
  onClose: () => void;
  template: CharacterTemplate;
}

export const WorksheetModal: React.FC<WorksheetModalProps> = ({
  visible,
  onClose,
  template,
}) => {
  if (!template) return null;

  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
  };

  const renderStrokeSvg = (
    strokePoints: Array<{ x: number; y: number }>,
    size = 40,
    dashed = false
  ) => {
    if (strokePoints.length === 0) return '';
    const pad = 4;
    const drawSize = size - pad * 2;
    let d = `M ${pad + strokePoints[0].x * drawSize} ${pad + strokePoints[0].y * drawSize}`;
    for (let i = 1; i < strokePoints.length; i++) {
      d += ` L ${pad + strokePoints[i].x * drawSize} ${pad + strokePoints[i].y * drawSize}`;
    }
    return d;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Action Header */}
          <View style={styles.actionHeader}>
            <View>
              <Text style={styles.modalTitle}>📄 Printable Tracing Worksheet</Text>
              <Text style={styles.modalSubtitle}>
                Ready to print for paper-and-pencil handwriting practice
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
                <Text style={styles.printBtnText}>🖨️ Print Sheet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Printable Sheet View */}
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
          >
            <View style={styles.worksheetSheet}>
              {/* Sheet Title Bar */}
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.schoolName}>KANO GUJARATI LEARNING</Text>
                  <Text style={styles.sheetMainTitle}>ગુજરાતી લેખન અભ્યાસ (Handwriting Practice)</Text>
                </View>
                <View style={styles.studentInfoBox}>
                  <Text style={styles.infoLine}>Name: ______________________</Text>
                  <Text style={styles.infoLine}>Date:  ______________________</Text>
                </View>
              </View>

              {/* Character Profile Section */}
              <View style={styles.charProfileRow}>
                {/* Big Character Card */}
                <View style={styles.bigCharCard}>
                  <Text style={styles.bigCharSymbol}>{template.gujarati}</Text>
                  <Text style={styles.charNameText}>{template.name} ({template.transliteration})</Text>
                  <Text style={styles.charCategoryText}>
                    Category: {template.category.toUpperCase()} • {template.strokeCount} STROKE{template.strokeCount > 1 ? 'S' : ''}
                  </Text>
                </View>

                {/* Stroke Sequence Guide */}
                <View style={styles.strokeGuideCard}>
                  <Text style={styles.sectionHeaderTitle}>Stroke Order Sequence</Text>
                  <View style={styles.strokeStepsRow}>
                    {template.strokes.map((stroke, idx) => (
                      <View key={`seq-${idx}`} style={styles.stepBox}>
                        <View style={styles.stepNumberBadge}>
                          <Text style={styles.stepNumberText}>{idx + 1}</Text>
                        </View>
                        <View style={styles.miniCanvas}>
                          <Svg width={60} height={60}>
                            {/* Prior strokes dimmed */}
                            {template.strokes.slice(0, idx).map((s, sIdx) => (
                              <Path
                                key={`prior-${sIdx}`}
                                d={renderStrokeSvg(s.points, 60)}
                                stroke="#94a3b8"
                                strokeWidth={2}
                                strokeDasharray="3, 3"
                                fill="none"
                              />
                            ))}
                            {/* Current stroke bold */}
                            <Path
                              d={renderStrokeSvg(stroke.points, 60)}
                              stroke="#0284c7"
                              strokeWidth={3.5}
                              fill="none"
                            />
                            {/* Start Point */}
                            <Circle
                              cx={4 + stroke.startPoint.x * 52}
                              cy={4 + stroke.startPoint.y * 52}
                              r={4}
                              fill="#ef4444"
                            />
                          </Svg>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Row 1: Guided Tracing Line */}
              <View style={styles.practiceSection}>
                <Text style={styles.practiceSectionTitle}>
                  Step 1: Trace the Dotted Strokes (ટપકાં જોડો)
                </Text>
                <View style={styles.practiceGridRow}>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <View key={`trace-1-${idx}`} style={styles.practiceCell}>
                      <View style={styles.guidelineTop} />
                      <View style={styles.guidelineMid} />
                      <View style={styles.guidelineBase} />
                      <Svg width={48} height={48} style={styles.cellSvg}>
                        {template.strokes.map((s, sIdx) => (
                          <Path
                            key={`dotted-${sIdx}`}
                            d={renderStrokeSvg(s.points, 48)}
                            stroke={idx === 0 ? '#0284c7' : '#94a3b8'}
                            strokeWidth={idx === 0 ? 3 : 2.5}
                            strokeDasharray={idx === 0 ? undefined : '3, 3'}
                            fill="none"
                          />
                        ))}
                      </Svg>
                    </View>
                  ))}
                </View>
              </View>

              {/* Row 2: Light Tracing Line */}
              <View style={styles.practiceSection}>
                <Text style={styles.practiceSectionTitle}>
                  Step 2: Light Guide Tracing (હળવા ટપકાં)
                </Text>
                <View style={styles.practiceGridRow}>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <View key={`trace-2-${idx}`} style={styles.practiceCell}>
                      <View style={styles.guidelineTop} />
                      <View style={styles.guidelineMid} />
                      <View style={styles.guidelineBase} />
                      <Svg width={48} height={48} style={styles.cellSvg}>
                        {template.strokes.map((s, sIdx) => (
                          <Path
                            key={`light-${sIdx}`}
                            d={renderStrokeSvg(s.points, 48)}
                            stroke="#cbd5e1"
                            strokeWidth={2}
                            strokeDasharray="4, 4"
                            fill="none"
                          />
                        ))}
                      </Svg>
                    </View>
                  ))}
                </View>
              </View>

              {/* Row 3: Independent Practice Line */}
              <View style={styles.practiceSection}>
                <Text style={styles.practiceSectionTitle}>
                  Step 3: Freehand Writing with Starting Dot (જાતે લખો)
                </Text>
                <View style={styles.practiceGridRow}>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <View key={`free-${idx}`} style={styles.practiceCell}>
                      <View style={styles.guidelineTop} />
                      <View style={styles.guidelineMid} />
                      <View style={styles.guidelineBase} />
                      <Svg width={48} height={48} style={styles.cellSvg}>
                        {/* Start point dot */}
                        <Circle
                          cx={4 + template.strokes[0].startPoint.x * 40}
                          cy={4 + template.strokes[0].startPoint.y * 40}
                          r={3}
                          fill="#ef4444"
                        />
                      </Svg>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '94%',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: '#0f172a',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  printBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  printBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    padding: 16,
  },
  worksheetSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 12,
    marginBottom: 16,
  },
  schoolName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 1,
  },
  sheetMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  studentInfoBox: {
    gap: 4,
  },
  infoLine: {
    fontSize: 11,
    color: '#475569',
  },
  charProfileRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 18,
  },
  bigCharCard: {
    width: 140,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigCharSymbol: {
    fontSize: 54,
    fontWeight: '800',
    color: '#0f172a',
  },
  charNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 4,
  },
  charCategoryText: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  strokeGuideCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  strokeStepsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepBox: {
    alignItems: 'center',
  },
  stepNumberBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  miniCanvas: {
    width: 60,
    height: 60,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  practiceSection: {
    marginBottom: 16,
  },
  practiceSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  practiceGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  practiceCell: {
    flex: 1,
    height: 64,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  guidelineTop: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  guidelineMid: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  guidelineBase: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  cellSvg: {
    zIndex: 2,
  },
});
