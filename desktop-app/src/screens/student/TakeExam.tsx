import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useExamStore } from '../../store/examStore';
import { useAttemptStore } from '../../store/attemptStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useCameraCapture } from '../../hooks/useCameraCapture';
import { useExamSecurity, fetchScenarioImage } from '../../hooks/useExamSecurity';
import {
  QuestionType,
  flattenExamQuestions,
  buildAttemptsPayload,
  NormalizedGroup,
  MCQOption,
} from '../../lib/utils/exam-schema';

const hasElectronAPI = () =>
  typeof window !== 'undefined' && !!(window as any).electronAPI;

interface AnswerRenderProps {
  value: any;
  onChange: (value: any) => void;
}

function MCQAnswer({ qn, value, onChange }: AnswerRenderProps & { qn: any }) {
  const selected: string | null = typeof value === 'string' ? value : null;
  return (
    <div className="options-list">
      {(qn.options || []).map((opt: MCQOption) => {
        const active = selected === opt.letter;
        return (
          <button
            key={opt.letter}
            type="button"
            className={`option${active ? ' option--active' : ''}`}
            onClick={() => onChange(active ? null : opt.letter)}
          >
            <span className="option__letter">{opt.letter}</span>
            <span>{opt.option}</span>
          </button>
        );
      })}
    </div>
  );
}

function TrueFalseAnswer({ value, onChange }: AnswerRenderProps) {
  return (
    <div className="options-list">
      {['True', 'False'].map((option) => {
        const boolVal = option === 'True';
        const active = value === boolVal;
        return (
          <button
            key={option}
            type="button"
            className={`option${active ? ' option--active' : ''}`}
            onClick={() => onChange(boolVal)}
          >
            <span>{option}</span>
          </button>
        );
      })}
    </div>
  );
}

function MatchingAnswer({ qn, value, onChange }: AnswerRenderProps & { qn: any }) {
  const mapping: Record<number, number> = value && typeof value === 'object' ? { ...value } : {};
  const rightItems: string[] = qn.right_items || [];

  const setMapping = (leftIdx: number, rightIdx: number) => {
    const next: Record<number, number> = { ...mapping };
    Object.keys(next).forEach((k) => {
      if (next[Number(k)] === rightIdx) delete next[Number(k)];
    });
    if (rightIdx === -1) {
      delete next[leftIdx];
    } else {
      next[leftIdx] = rightIdx;
    }
    onChange(next);
  };

  return (
    <div>
      {(qn.left_items || []).map((left: string, i: number) => (
        <div key={i} className="matching-row">
          <div className="matching-row__left">{left}</div>
          <select value={mapping[i] ?? -1} onChange={(e) => setMapping(i, Number(e.target.value))}>
            <option value={-1}>Select…</option>
            {rightItems.map((r, ri) => {
              const taken = Object.values(mapping).includes(ri) && mapping[i] !== ri;
              return (
                <option key={ri} value={ri} disabled={taken}>
                  {ri + 1}. {r}
                </option>
              );
            })}
          </select>
        </div>
      ))}
    </div>
  );
}

function BlankSpaceAnswer({ qn, value, onChange }: AnswerRenderProps & { qn: any }) {
  const count = qn.blank_count || qn.correct_answers?.length || 1;
  const blanks: string[] = Array.isArray(value) ? value : [];

  const setBlank = (i: number, text: string) => {
    const next = Array.from({ length: count }, (_, idx) => blanks[idx] ?? '');
    next[i] = text;
    onChange(next);
  };

  return (
    <div className="blank-inputs">
      {Array.from({ length: count }, (_, i) => (
        <Input
          key={i}
          label={`Blank #${i + 1}`}
          placeholder="Your answer"
          value={blanks[i] ?? ''}
          onChange={(text) => setBlank(i, text)}
        />
      ))}
    </div>
  );
}

function FullscreenBlock() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--color-background)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <h2 style={{ fontSize: 24 }}>Fullscreen Required</h2>
      <p className="text-secondary">
        Please switch back to fullscreen mode to continue. The exam is blocked until the screen
        is fullscreen again.
      </p>
    </div>
  );
}

export default function TakeExam() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { examByCode: currentExam, fetchStudentExamById } = useExamStore();
  const { startAttempt, currentAttempt, updateCurrentAttemptAnswers, submitAttempt } = useAttemptStore();

  const [step, setStep] = useState<'info' | 'camera' | 'questions' | 'submit'>('info');
  const [timeLeft, setTimeLeft] = useState(0);
  const [faceImage, setFaceImage] = useState<{ dataUrl: string; name: string } | null>(null);
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
  const [groups, setGroups] = useState<NormalizedGroup[]>([]);
  const [scenarioImages, setScenarioImages] = useState<Record<string, string>>({});
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [fullscreenBlocked, setFullscreenBlocked] = useState(false);
  const [preview, setPreview] = useState(false);
  const submittedRef = useRef(false);

  const camera = useCameraCapture();

  const handleSubmit = useCallback(async () => {
    if (!currentAttempt || submittedRef.current) return;
    submittedRef.current = true;

    setIsSubmitting(true);
    try {
      await submitAttempt(currentAttempt.id, buildAttemptsPayload(answers) as any);
      setStep('submit');
    } catch (err: any) {
      submittedRef.current = false;
      window.alert(err.message || 'Failed to submit exam');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentAttempt, answers, submitAttempt]);

  const { violations, clearViolations } = useExamSecurity({
    enabled: step === 'questions',
    onViolation: (violation) => {
      setSecurityWarning(violation.message);
    },
    onAutoSubmit: () => {
      handleSubmit();
    },
  });

  const exitFullscreen = useCallback(() => {
    if (hasElectronAPI()) {
      (window as any).electronAPI.setFullScreen(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchStudentExamById(id);
    }
  }, [id, fetchStudentExamById]);

  useEffect(() => {
    if (currentExam && step === 'questions') {
      setTimeLeft(currentExam.duration_minutes * 60);
    }
  }, [currentExam, step]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!groups.length) return;
      const imageIds: string[] = [];
      groups.forEach((g) => {
        if (g.scenario_image_ids && Array.isArray(g.scenario_image_ids)) {
          imageIds.push(...g.scenario_image_ids);
        }
      });
      if (imageIds.length === 0) return;
      const imagesMap: Record<string, string> = {};
      for (const fileId of imageIds) {
        const dataUrl = await fetchScenarioImage(fileId);
        if (dataUrl) imagesMap[fileId] = dataUrl;
      }
      setScenarioImages(imagesMap);
    };
    if (step === 'questions') {
      fetchImages();
    }
  }, [groups, step]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
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
  }, [step, timeLeft, handleSubmit]);

  useEffect(() => {
    if (step === 'questions' && hasElectronAPI()) {
      (window as any).electronAPI.setFullScreen(true);
      (window as any).electronAPI.isFullScreen().then((fs: boolean) => {
        if (!fs) setFullscreenBlocked(true);
      });
      (window as any).electronAPI.onFullScreenChange((isFs: boolean) => {
        setFullscreenBlocked(!isFs);
      });
      clearViolations();
    }
    if (step !== 'questions') {
      exitFullscreen();
    }
  }, [step, exitFullscreen, clearViolations]);

  useEffect(() => {
    return () => {
      exitFullscreen();
    };
  }, [exitFullscreen]);

  const handleInfoSubmit = async () => {
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

  useEffect(() => {
    if (step === 'camera' && camera.permissionDenied) {
      // no auto start when already denied
    }
    if (step === 'camera') {
      camera.startCamera();
    }
  }, [step]);

  const handleTakePhoto = () => {
    const dataUrl = camera.capturePhoto();
    if (!dataUrl) {
      window.alert('Could not capture photo. Check your camera is connected.');
      return;
    }
    setFaceImage({ dataUrl, name: 'face.jpg' });
    setPreview(true);
  };

  const handleRetake = () => {
    setFaceImage(null);
    setPreview(false);
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
      const examGroups = flattenExamQuestions(currentExam.questions);
      setGroups(examGroups);
      submittedRef.current = false;
      setAnswers({});
      setPreview(false);
      camera.stopCamera();
      setStep('questions');
    } catch (err: any) {
      window.alert(err.message || 'Failed to start exam');
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const flatQuestions = groups.flatMap((g) =>
    g.questions.map((q) => ({ ...q, scenario: q.scenario ?? g.scenario, scenario_image_ids: q.scenario_image_ids ?? g.scenario_image_ids }))
  );

  if (step === 'info') {
    return (
      <div className="page" style={{ height: '100%' }}>
        {fullscreenBlocked && <FullscreenBlock />}
        <div className="page__inner" style={{ maxWidth: 820 }}>
          <div className="page__header">
            <h1 className="page__title">Student Information</h1>
            <p className="page__subtitle">Please provide your details before starting the exam</p>
          </div>

          <Card style={{ marginBottom: 16 }}>
            <Input label="First Name" value={studentInfo.firstName} onChange={(v) => setStudentInfo({ ...studentInfo, firstName: v })} error={errors.firstName} />
            <Input label="Last Name" value={studentInfo.lastName} onChange={(v) => setStudentInfo({ ...studentInfo, lastName: v })} error={errors.lastName} />
            <Input label="Student ID" value={studentInfo.studentId} onChange={(v) => setStudentInfo({ ...studentInfo, studentId: v })} error={errors.studentId} />
            <Input label="Department (Optional)" value={studentInfo.department} onChange={(v) => setStudentInfo({ ...studentInfo, department: v })} />
            <Input label="Year of Study (Optional)" value={studentInfo.yearOfStudy} onChange={(v) => setStudentInfo({ ...studentInfo, yearOfStudy: v })} />
            <Input label="Semester (Optional)" value={studentInfo.semester} onChange={(v) => setStudentInfo({ ...studentInfo, semester: v })} />
            <Input label="Section (Optional)" value={studentInfo.section} onChange={(v) => setStudentInfo({ ...studentInfo, section: v })} />
          </Card>

          <div className="button-row">
            <Button title="Continue" onPress={handleInfoSubmit} />
            <Button title="Cancel" variant="outline" onPress={() => navigate(-1)} />
          </div>
        </div>
      </div>
    );
  }

  if (step === 'camera') {
    return (
      <div className="page" style={{ height: '100%' }}>
        {fullscreenBlocked && <FullscreenBlock />}
        <div className="page__inner" style={{ maxWidth: 820 }}>
          <div className="page__header">
            <h1 className="page__title">Face Verification</h1>
            <p className="page__subtitle">Capture your face for identity verification</p>
          </div>

          <Card style={{ marginBottom: 16 }}>
            <div className="camera-view-wrap">
              <div className="camera-view">
                {preview && faceImage ? (
                  <img src={faceImage.dataUrl} alt="Captured face" />
                ) : camera.isReady ? (
                  <video ref={camera.videoRef} autoPlay playsInline muted />
                ) : (
                  <div className="camera-view__placeholder">
                    <p style={{ fontWeight: 600 }}>
                      {camera.permissionDenied
                        ? 'Camera permission denied'
                        : camera.error || 'Starting camera...'}
                    </p>
                    {camera.permissionDenied && (
                      <span>Allow camera access in your system settings to continue.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="button-row">
            {preview && faceImage ? (
              <>
                <Button title="Confirm" onPress={handleStartExam} loading={isSubmitting} />
                <Button title="Retake" variant="outline" onPress={handleRetake} />
              </>
            ) : (
              <>
                <Button title="Take Photo" onPress={handleTakePhoto} disabled={!camera.isReady} />
                <Button title="Cancel" variant="outline" onPress={() => setStep('info')} />
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'questions') {
    return (
      <div className="take-exam">
        <div className="timer-bar">Time Remaining: {formatTime(timeLeft)}</div>
        {securityWarning && (
          <div className="security-bar" onClick={() => setSecurityWarning(null)}>
            ⚠️ {securityWarning}
          </div>
        )}
        {violations.length > 0 && (
          <div className="security-bar">
            ⚠️ Security violations detected: {violations.length}
          </div>
        )}

        <div className="take-exam__content">
          <div className="page__inner" style={{ maxWidth: 1080 }}>
            {flatQuestions.length > 0 ? (
              flatQuestions.map((qn, index) => (
                <div key={qn.id || index}>
                  {qn.scenario && (index === 0 || flatQuestions[index - 1].scenario !== qn.scenario) && (
                    <Card className="scenario-card" style={{ marginBottom: 16 }}>
                      <div className="scenario-card__label">Passage</div>
                      <p className="scenario-card__text">{qn.scenario}</p>
                    </Card>
                  )}
                  {qn.scenario_image_ids && qn.scenario_image_ids.length > 0 && (
                    <Card style={{ marginBottom: 16 }}>
                      <div className="scenario-card__label">Images</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, overflowX: 'auto' }}>
                        {qn.scenario_image_ids.map((imageId: string) => {
                          const uri = scenarioImages[imageId];
                          return uri ? (
                            <img
                              key={imageId}
                              src={uri}
                              alt="Scenario"
                              style={{ width: 200, height: 150, objectFit: 'contain', borderRadius: 8, cursor: 'pointer' }}
                              onClick={() => {
                                setModalImage(uri);
                                setZoom(1);
                              }}
                            />
                          ) : (
                            <div
                              key={imageId}
                              style={{
                                width: 200,
                                height: 150,
                                borderRadius: 8,
                                backgroundColor: 'var(--color-surface-variant)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-text-secondary)',
                                fontSize: 12,
                              }}
                            >
                              Loading...
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  )}
                  <Card className="question-card">
                    <div className="question-card__header">
                      <span>Question {index + 1}</span>
                      <span>{qn.point} pts</span>
                    </div>
                    <p className="question-card__text">{qn.question}</p>

                    {qn.type === QuestionType.MCQ && (
                      <MCQAnswer qn={qn} value={answers[qn.id]} onChange={(v) => handleAnswerChange(qn.id, v)} />
                    )}
                    {qn.type === QuestionType.TRUE_FALSE && (
                      <TrueFalseAnswer value={answers[qn.id]} onChange={(v) => handleAnswerChange(qn.id, v)} />
                    )}
                    {qn.type === QuestionType.MATCHING && (
                      <MatchingAnswer qn={qn} value={answers[qn.id]} onChange={(v) => handleAnswerChange(qn.id, v)} />
                    )}
                    {qn.type === QuestionType.BLANK_SPACE && (
                      <BlankSpaceAnswer qn={qn} value={answers[qn.id]} onChange={(v) => handleAnswerChange(qn.id, v)} />
                    )}
                    {qn.type === QuestionType.SHORT_ANSWER && (
                      <Input
                        placeholder="Type your answer here..."
                        value={typeof answers[qn.id] === 'string' ? answers[qn.id] : ''}
                        onChange={(v) => handleAnswerChange(qn.id, v)}
                        multiline
                      />
                    )}
                  </Card>
                </div>
              ))
            ) : (
              <Card>
                <p className="text-secondary">No questions available for this exam</p>
              </Card>
            )}

            <div className="submit-row">
              <Button title="Submit Exam" onPress={handleSubmit} loading={isSubmitting} />
            </div>
          </div>
        </div>

        <Modal visible={!!modalImage} onClose={() => setModalImage(null)} wide>
          <img
            src={modalImage || undefined}
            alt="Scenario image"
            className="image-modal__img"
            style={{ transform: `scale(${zoom})` }}
          />
          <div className="image-modal__controls">
            <Button title="−" variant="outline" size="small" onPress={() => setZoom((z) => Math.max(0.5, z - 0.25))} />
            <Button title="+" variant="outline" size="small" onPress={() => setZoom((z) => Math.min(3, z + 0.25))} />
            <Button title="Close" variant="outline" size="small" onPress={() => setModalImage(null)} />
          </div>
        </Modal>
      </div>
    );
  }

  if (step === 'submit') {
    return (
      <div className="center" style={{ backgroundColor: 'var(--color-background)', height: '100%' }}>
        <h1 style={{ fontSize: 24, color: 'var(--color-success)' }}>Exam Submitted</h1>
        <p className="text-secondary">Your exam has been submitted successfully</p>
        <Button title="Back to Dashboard" variant="outline" onPress={() => navigate('/dashboard')} style={{ marginTop: 24 }} />
      </div>
    );
  }

  return null;
}