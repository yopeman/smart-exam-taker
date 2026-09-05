import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAttemptStore } from '../../../store/attemptStore';
import { useTheme } from '../../../lib/theme/theme';
import { Card } from '../../../components/ui/Card';
import { usePagination, Pagination } from '../../../components/ui/Pagination';

export default function AttemptsScreen() {
  const router = useRouter();
  const { myAttempts, fetchMyAttempts, isLoading } = useAttemptStore();
  const { theme } = useTheme();

  const pagination = usePagination(myAttempts, 5);

  useEffect(() => {
    fetchMyAttempts();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return theme.colors.success;
      case 'submitted':
      case 'processing':
        return theme.colors.warning;
      case 'in_progress':
        return theme.colors.info;
      default:
        return theme.colors.textLight;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.typography.sizes['2xl'] }]}>
          My Attempts
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
          {myAttempts.length} attempts
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <View style={styles.center}>
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
              Loading attempts...
            </Text>
          </View>
        ) : myAttempts.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
              No exam attempts yet
            </Text>
          </View>
        ) : (
          pagination.paged.map((attempt) => {
            const school = attempt.school ?? null;
            const exam = attempt.exam ?? null;
            const primaryColor = school?.primary_color || theme.colors.primary;
            return (
              <TouchableOpacity
                key={attempt.id}
                onPress={() => router.push(`/(student)/attempts/${attempt.id}`)}
              >
                <Card
                  variant="elevated"
                  style={{
                    ...styles.attemptCard,
                    ...(school?.primary_color
                      ? { borderLeftWidth: 4, borderLeftColor: school.primary_color }
                      : {}),
                  }}
                >
                  <View style={styles.schoolRow}>
                    {school?.logo_url ? (
                      <Image
                        source={{ uri: school.logo_url }}
                        style={[
                          styles.schoolLogo,
                          school?.primary_color ? { borderColor: school.primary_color } : null,
                        ]}
                        resizeMode="contain"
                      />
                    ) : school?.name ? (
                      <View style={[styles.schoolAvatar, { backgroundColor: primaryColor }]}>
                        <Text style={[styles.schoolAvatarText, { fontSize: theme.typography.sizes.sm }]}>
                          {school.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    ) : null}
                    {school?.name && (
                      <Text
                        style={[
                          styles.schoolName,
                          { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs },
                        ]}
                        numberOfLines={1}
                      >
                        {school.name}
                      </Text>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(attempt.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(attempt.status), fontSize: theme.typography.sizes.xs }]}>
                        {getStatusText(attempt.status)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.examTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.lg }]}>
                    {exam?.title || 'Unknown exam'}
                  </Text>
                  {exam?.code && (
                    <Text style={[styles.examCode, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs }]}>
                      {exam.code}
                    </Text>
                  )}

                  <View style={styles.divider} />

                  <View style={styles.attemptMeta}>
                    <Text style={[styles.metaLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs }]}>
                      Student
                    </Text>
                    <Text style={[styles.metaValue, { color: theme.colors.text, fontSize: theme.typography.sizes.sm }]}>
                      {attempt.student_first_name} {attempt.student_last_name}
                    </Text>
                  </View>

                  <View style={styles.attemptMeta}>
                    <Text style={[styles.metaLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs }]}>
                      Student ID
                    </Text>
                    <Text style={[styles.metaValue, { color: theme.colors.text, fontSize: theme.typography.sizes.sm }]}>
                      {attempt.student_id_number}
                    </Text>
                  </View>

                  {attempt.department && (
                    <View style={styles.attemptMeta}>
                      <Text style={[styles.metaLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs }]}>
                        Department
                      </Text>
                      <Text style={[styles.metaValue, { color: theme.colors.text, fontSize: theme.typography.sizes.sm }]}>
                        {attempt.department}
                      </Text>
                    </View>
                  )}

                  {attempt.total_score !== null && (
                    <View style={[styles.scoreContainer, { borderTopColor: theme.colors.border }]}>
                      <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
                        Total Score
                      </Text>
                      <Text style={[styles.scoreValue, { color: theme.colors.primary, fontSize: theme.typography.sizes['2xl'] }]}>
                        {attempt.total_score}
                      </Text>
                    </View>
                  )}

                  <View style={styles.attemptMeta}>
                    <Text style={[styles.metaLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs }]}>
                      Submitted
                    </Text>
                    <Text style={[styles.metaValue, { color: theme.colors.text, fontSize: theme.typography.sizes.sm }]}>
                      {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : 'Not submitted'}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
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
  attemptCard: {
    marginBottom: 16,
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  schoolLogo: {
    width: 28,
    height: 28,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  schoolAvatar: {
    width: 28,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  schoolName: {
    flex: 1,
    marginLeft: 8,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontWeight: '600',
  },
  examTitle: {
    fontWeight: '600',
  },
  examCode: {
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  attemptMeta: {
    marginBottom: 8,
  },
  metaLabel: {
    marginBottom: 2,
  },
  metaValue: {
    fontWeight: '500',
  },
  scoreContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  scoreLabel: {
    marginBottom: 4,
  },
  scoreValue: {
    fontWeight: 'bold',
  },
});