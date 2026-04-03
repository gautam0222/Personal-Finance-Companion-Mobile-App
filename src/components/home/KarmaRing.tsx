import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RingProgress } from '../charts/RingProgress';
import { useTheme } from '../../hooks/useTheme';
import { useKarma } from '../../hooks/useKarma';
import { Card } from '../common/Card';
import { Spacing, Radius } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

export const KarmaRing: React.FC = () => {
  const { colors } = useTheme();
  const karma = useKarma();

  const levelIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
    Novice:  'leaf-outline',
    Tracker: 'flash-outline',
    Saver:   'star-outline',
    Master:  'diamond-outline',
    Legend:  'trophy-outline',
  };

  return (
    <Card style={styles.card} padding={Spacing[5]}>
      <View style={styles.row}>
        {/* Ring */}
        <RingProgress
          progress={karma.score}
          size={96}
          strokeWidth={9}
          colors={['#6366F1', '#8B5CF6']}
        >
          <Text style={[styles.scoreNum, { color: colors.text }]}>{karma.score}</Text>
        </RingProgress>

        {/* Info */}
        <View style={styles.info}>
          {/* Level row */}
          <View style={styles.levelRow}>
            <View style={[styles.levelIcon, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons
                name={levelIcon[karma.level] ?? 'star-outline'}
                size={14}
                color={colors.primaryLight}
              />
            </View>
            <View>
              <Text style={[styles.levelName, { color: colors.text }]}>{karma.level}</Text>
              <Text style={[styles.levelSub, { color: colors.textTertiary }]}>Karma Level</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statPill, { backgroundColor: 'rgba(245,158,11,0.10)', borderColor: 'rgba(245,158,11,0.20)' }]}>
              <Ionicons name="flame-outline" size={12} color="#F59E0B" />
              <Text style={[styles.statVal, { color: '#F59E0B' }]}>{karma.streakDays}</Text>
              <Text style={[styles.statLbl, { color: colors.textTertiary }]}>streak</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryMutedBorder }]}>
              <Ionicons name="arrow-up-circle-outline" size={12} color={colors.primaryLight} />
              <Text style={[styles.statVal, { color: colors.primaryLight }]}>
                {karma.nextLevelAt - karma.score}
              </Text>
              <Text style={[styles.statLbl, { color: colors.textTertiary }]}>to next</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Progress bar to next level */}
      <View style={styles.progressWrap}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, {
            width: `${Math.round((karma.score / karma.nextLevelAt) * 100)}%`,
            backgroundColor: colors.primaryLight,
          }]} />
        </View>
        <Text style={[styles.progressLabel, { color: colors.textTertiary }]}>
          {karma.score} / {karma.nextLevelAt} to {
            karma.level === 'Novice' ? 'Tracker'
            : karma.level === 'Tracker' ? 'Saver'
            : karma.level === 'Saver' ? 'Master'
            : karma.level === 'Master' ? 'Legend'
            : 'Max'
          }
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[5], marginBottom: Spacing[4] },
  info: { flex: 1, gap: Spacing[3] },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  levelIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  levelName: { fontSize: FontSize.md, fontWeight: '700', letterSpacing: -0.2 },
  levelSub:  { fontSize: FontSize.xs, marginTop: 1 },
  scoreNum:  { fontSize: FontSize['2xl'], fontWeight: '700', letterSpacing: -1 },
  statsRow:  { flexDirection: 'row', gap: Spacing[2] },
  statPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 4, borderRadius: Radius.full, borderWidth: 1,
    paddingVertical: Spacing[1.5], paddingHorizontal: Spacing[3],
  },
  statVal: { fontSize: FontSize.sm, fontWeight: '700' },
  statLbl: { fontSize: 9 },
  progressWrap: { gap: Spacing[1.5] },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: 3, borderRadius: 2 },
  progressLabel: { fontSize: 10 },
});