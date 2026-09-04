import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useExamStore } from '../../../store/examStore';
import { useAttemptStore } from '../../../store/attemptStore';
import { useTheme } from '../../../lib/theme/theme';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export default function TakeExamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentExam, fetchExamById } = useExamStore();
  const { startAttempt, currentAttempt, updateCurrentAttemptAnswers, submitAttempt } = useAttemptStore();
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  
  const examId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [step, setStep] = useState<'info' | 'camera' | 'questions' | 'submit'>('info');
  const [timeLeft, setTimeLeft] = useState(0);
  const [faceImage, setFaceImage] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [studentInfo, setStudentInfo] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    department: '',
    yearOfStudy: '',
    semester: '',
    section: '',
  });
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchExamById(examId);
    }
  }, [examId]);

  useEffect(() => {
    if (currentExam && step === 'questions') {
      setTimeLeft(currentExam.duration_minutes * 60);
    }
  }, [currentExam, step]);

  useEffect(() => {
    let interval: number;
    if (step === 'questions' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  const handleInfoSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    if (!studentInfo.firstName) newErrors.firstName = 'First name is required';
    if (!studentInfo.lastName) newErrors.lastName = 'Last name is required';
    if (!studentInfo.studentId) newErrors.studentId = 'Student ID is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setStep('camera');
  };

  const handleCameraPermission = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required for face verification');
        return;
      }
    }
    setStep('camera');
  };

  const handleTakePicture = async () => {
    // This would be implemented with actual camera
    // For now, we'll use image picker as fallback
    await handlePickImage();
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      setFaceImage({
        uri: result.assets[0].uri,
        type: result.assets[0].type || 'image/jpeg',
        name: 'face.jpg',
      });
      setStep('questions');
    }
  };

  const handleStartExam = async () => {
    if (!currentExam || !faceImage) return;

    setIsSubmitting(true);
    try {
      await startAttempt(
        {
          exam_code: currentExam.code,
          student_first_name: studentInfo.firstName,
          student_last_name: studentInfo.lastName,
          student_id_number: studentInfo.studentId,
          department: studentInfo.department || undefined,
          year_of_study: studentInfo.yearOfStudy ? parseInt(studentInfo.yearOfStudy) : undefined,
          semester: studentInfo.semester || undefined,
          section: studentInfo.section || undefined,
        },
        faceImage
      );
      setStep('questions');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start exam');
      setStep('info');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    updateCurrentAttemptAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!currentAttempt) return;

    setIsSubmitting(true);
    try {
      await submitAttempt(currentAttempt.id, { answers });
      setStep('submit');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'info') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.typography.sizes['2xl'] }]}>
              Student Information
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Please provide your details before starting the exam
            </Text>
          </View>

          <Card style={styles.card}>
            <Input
              label="First Name"
              value={studentInfo.firstName}
              onChangeText={(text) => setStudentInfo({ ...studentInfo, firstName: text })}
              error={errors.firstName}
            />
            <Input
              label="Last Name"
              value={studentInfo.lastName}
              onChangeText={(text) => setStudentInfo({ ...studentInfo, lastName: text })}
              error={errors.lastName}
            />
            <Input
              label="Student ID"
              value={studentInfo.studentId}
              onChangeText={(text) => setStudentInfo({ ...studentInfo, studentId: text })}
              error={errors.studentId}
            />
            <Input
              label="Department (Optional)"
              value={studentInfo.department}
              onChangeText={(text) => setStudentInfo({ ...studentInfo, department: text })}
            />
            <Input
              label="Year of Study (Optional)"
              value={studentInfo.yearOfStudy}
              onChangeText={(text) => setStudentInfo({ ...studentInfo, yearOfStudy: text })}
              keyboardType="number-pad"
            />
            <Input
              label="Semester (Optional)"
              value={studentInfo.semester}
              onChangeText={(text) => setStudentInfo({ ...studentInfo, semester: text })}
            />
            <Input
              label="Section (Optional)"
              value={studentInfo.section}
              onChangeText={(text) => setStudentInfo({ ...studentInfo, section: text })}
            />
          </Card>

          <View style={styles.buttonContainer}>
            <Button
              title="Continue"
              onPress={handleInfoSubmit}
              style={styles.button}
            />
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={styles.button}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (step === 'camera') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.typography.sizes['2xl'] }]}>
            Face Verification
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
            Capture your face for identity verification
          </Text>
        </View>

        <View style={styles.cameraContainer}>
          <Card style={styles.cameraCard}>
            <View style={[styles.cameraPlaceholder, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.cameraText, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
                Camera Preview
              </Text>
            </View>
          </Card>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Take Photo"
            onPress={handleCameraPermission}
            style={styles.button}
          />
          <Button
            title="Choose from Gallery"
            onPress={handlePickImage}
            variant="outline"
            style={styles.button}
          />
          <Button
            title="Cancel"
            onPress={() => setStep('info')}
            variant="outline"
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  if (step === 'questions') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.timerBar, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.timerText, { color: '#FFFFFF', fontSize: theme.typography.sizes.md }]}>
            Time Remaining: {formatTime(timeLeft)}
          </Text>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.typography.sizes.xl }]}>
              {currentExam?.title}
            </Text>
          </View>

          {currentExam?.questions && Array.isArray(currentExam.questions) ? (
            currentExam.questions.map((question: any, index: number) => (
              <Card key={question.id || index} style={styles.questionCard}>
                <Text style={[styles.questionNumber, { color: theme.colors.primary, fontSize: theme.typography.sizes.sm }]}>
                  Question {index + 1}
                </Text>
                <Text style={[styles.questionText, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
                  {question.text || question.question}
                </Text>

                {question.type === 'multiple_choice' && question.options && (
                  <View style={styles.optionsContainer}>
                    {question.options.map((option: string, optIndex: number) => (
                      <TouchableOpacity
                        key={optIndex}
                        style={[
                          styles.option,
                          answers[question.id || index] === option && { backgroundColor: theme.colors.primary + '20' }
                        ]}
                        onPress={() => handleAnswerChange(question.id || index, option)}
                      >
                        <Text style={[styles.optionText, { color: theme.colors.text, fontSize: theme.typography.sizes.sm }]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {question.type === 'true_false' && (
                  <View style={styles.optionsContainer}>
                    {['True', 'False'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.option,
                          answers[question.id || index] === option && { backgroundColor: theme.colors.primary + '20' }
                        ]}
                        onPress={() => handleAnswerChange(question.id || index, option)}
                      >
                        <Text style={[styles.optionText, { color: theme.colors.text, fontSize: theme.typography.sizes.sm }]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {(question.type === 'short_answer' || question.type === 'essay') && (
                  <Input
                    placeholder="Type your answer here..."
                    value={answers[question.id || index] || ''}
                    onChangeText={(text) => handleAnswerChange(question.id || index, text)}
                    multiline
                    style={styles.textAnswer}
                  />
                )}
              </Card>
            ))
          ) : (
            <Card style={styles.card}>
              <Text style={[styles.noQuestions, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
                No questions available for this exam
              </Text>
            </Card>
          )}
        </ScrollView>

        <View style={styles.submitContainer}>
          <Button
            title="Submit Exam"
            onPress={handleSubmit}
            loading={isSubmitting}
            style={styles.submitButton}
          />
        </View>
      </View>
    );
  }

  if (step === 'submit') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.successTitle, { color: theme.colors.success, fontSize: theme.typography.sizes['2xl'] }]}>
            Exam Submitted
          </Text>
          <Text style={[styles.successText, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
            Your exam has been submitted successfully
          </Text>
          <Button
            title="View Results"
            onPress={() => router.push('/(student)/attempts')}
            style={styles.button}
          />
          <Button
            title="Back to Dashboard"
            onPress={() => router.replace('/(student)')}
            variant="outline"
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
  },
  card: {
    margin: 24,
    marginTop: 0,
  },
  buttonContainer: {
    padding: 24,
    gap: 12,
  },
  button: {
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cameraCard: {
    width: '100%',
    aspectRatio: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  cameraText: {
  },
  timerBar: {
    padding: 16,
    alignItems: 'center',
  },
  timerText: {
    fontWeight: '600',
  },
  questionCard: {
    margin: 24,
    marginTop: 0,
    marginBottom: 16,
  },
  questionNumber: {
    fontWeight: '600',
    marginBottom: 8,
  },
  questionText: {
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionText: {
  },
  textAnswer: {
    minHeight: 100,
  },
  noQuestions: {
    textAlign: 'center',
  },
  submitContainer: {
    padding: 24,
    paddingBottom: 32,
  },
  submitButton: {
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    textAlign: 'center',
    marginBottom: 32,
  },
});
