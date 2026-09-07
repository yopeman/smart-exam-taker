import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useExamStore } from '../../../store/examStore';
import { useTheme } from '../../../lib/theme/theme';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function ExamsScreen() {
  const router = useRouter();
  const { availableExams, fetchAvailableExams, isLoading } = useExamStore();
  const { theme } = useTheme();

  useEffect(() => {
    fetchAvailableExams();
  }, []);

  const availableExamsList = availableExams.filter(e => e.is_available && !e.has_attempted);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.typography.sizes['2xl'] }]}>
          Available Exams
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
          {availableExamsList.length} exams available
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <View style={styles.center}>
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
              Loading exams...
            </Text>
          </View>
        ) : availableExamsList.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
              No exams available at the moment
            </Text>
          </View>
        ) : (
          availableExamsList.map((exam) => (
            <TouchableOpacity
              key={exam.id}
              onPress={() => router.push(`/(student)/exams/${exam.id}`)}
            >
              <Card variant="elevated" style={styles.examCard}>
                <Text style={[styles.examTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.lg }]}>
                  {exam.title}
                </Text>
                {exam.description && (
                  <Text style={[styles.examDescription, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
                    {exam.description}
                  </Text>
                )}
                <View style={styles.examMeta}>
                  <Text style={[styles.metaText, { color: theme.colors.textLight, fontSize: theme.typography.sizes.xs }]}>
                    {exam.duration_minutes} min
                  </Text>
                  {exam.department && (
                    <Text style={[styles.metaText, { color: theme.colors.textLight, fontSize: theme.typography.sizes.xs }]}>
                      • {exam.department}
                    </Text>
                  )}
                  {exam.year_of_study && (
                    <Text style={[styles.metaText, { color: theme.colors.textLight, fontSize: theme.typography.sizes.xs }]}>
                      • Year {exam.year_of_study}
                    </Text>
                  )}
                </View>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: theme.colors.success + '20' }]}>
                    <Text style={[styles.statusText, { color: theme.colors.success, fontSize: theme.typography.sizes.xs }]}>
                      Available
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
  },
  emptyText: {
    textAlign: 'center',
  },
  examCard: {
    marginBottom: 16,
  },
  examTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  examDescription: {
    marginBottom: 12,
  },
  examMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metaText: {
    marginRight: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontWeight: '600',
  },
});
