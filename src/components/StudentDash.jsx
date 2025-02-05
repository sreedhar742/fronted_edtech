import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './StudentDash.css'; // Import the updated CSS file
import axiosInstance from '../api/axiosInstance'; 
import QuestionListModal from './QuestionListModal';
import Select from 'react-select';

function StudentDash() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [selectedSubtopic, setSelectedSubtopic] = useState([]);
  const [questionType, setQuestionType] = useState('');
  const [questionLevel, setQuestionLevel] = useState('');
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [questionList, setQuestionList] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const classResponse = await axiosInstance.get('/classes/');
        const classesData = classResponse.data.data;
        // console.log('Classes:', classesData);
        setClasses(classesData);
      } catch (error) {
        console.error('Error fetching classes', error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchSubjects() {
      if (selectedClass) {
        try {
          console.log('Selected Class:', selectedClass);
          const subjectResponse = await axiosInstance.post('/subjects/', {
            class_id: selectedClass
          });
          setSubjects(subjectResponse.data.data);
        } catch (error) {
          console.error('Error fetching subjects:', error);
          setSubjects([]);
        }
      }
    }
    fetchSubjects();
  }, [selectedClass]);

  useEffect(() => {
    async function fetchChapters() {
      if (selectedSubject && selectedClass) {
        try {
          const chapterResponse = await axiosInstance.post('/chapters/', {
            subject_id: selectedSubject,
            class_id: selectedClass,
          });
          setChapters(chapterResponse.data.data);
        } catch (error) {
          console.error('Error fetching chapters:', error);
          setChapters([]);
        }
      }
    }
    fetchChapters();
  }, [selectedSubject, selectedClass]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
  };

  const handleQuestionClick = (question, index) => {
    console.log('Selected Values before navigate:', {
      class_id: selectedClass,
      subject_id: selectedSubject,
      topic_ids: selectedChapters,
      subtopic: selectedSubtopic
    });

    navigate('/solvequestion', { state: { 
      questionList,
      question,
      questionNumber: index + 1, 
      class_id: selectedClass,
      subject_id: selectedSubject,
      topic_ids: selectedChapters,
      subtopic: selectedSubtopic
    } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  //   if (!questionType || 
  //     (questionType === 'solved') ||
  //     (questionType === 'exercise') ||
  //     (questionType === 'external' && questionLevel)) {
  //    console.error('Please select a valid question type');
  //    return;
  //  }
    
    const requestData = {
      classid: Number(selectedClass),
      subjectid: Number(selectedSubject),
      topicid: selectedChapters,
      subtopicid: selectedSubtopic,
      solved: questionType === 'solved',
      exercise: questionType === 'exercise',
      external: questionType === 'external' ? questionLevel : null
    };
    if (!requestData.solved && !requestData.exercise && !requestData.external) {
      alert('Please select a valid question type');
      return;
    }
    console.log('Request Data:', requestData);
    
    try {
      const response = await axiosInstance.post('/question-images/', requestData);
      const questionsWithImages = response.data.questions.map((question) => {
        if (question.question_image) {
          return {
            ...question,
            question: question.question, // Ensure question is a string
            image: `data:image/png;base64,${question.question_image}`
          };
        }
        return {
          ...question,
          question: question.question // Ensure question is a string
        };
      });
      
      setQuestionList(questionsWithImages);
      setShowQuestionList(true);
    } catch (error) {
      console.error('Error generating question list', error);
      setShowQuestionList(true);
    }
  };

  const handleClose = () => {
    setShowQuestionList(false);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <main className="flex-fill d-flex justify-content-center align-items-center">
        <div className="form-container">
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col xs={12} md={6}>
                <Form.Group controlId="formClass">
                  <Form.Label>Class</Form.Label>
                  <Form.Control
                    as="select"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select Class</option>
                    {classes && classes.length > 0 && classes.map((cls) => (
                      <option key={cls.class_code} value={cls.class_code}>
                        {cls.class_name}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group controlId="formSubject">
                  <Form.Label>Subject</Form.Label>
                  <Form.Control
                    as="select"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.subject_code} value={subject.subject_code}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
            <Col xs={12} md={6}>
                <Form.Group controlId="formChapters">
                  <Form.Label>Chapters</Form.Label>
                  <Select
                    isMulti
                    options={chapters.map((chapter) => ({
                      value: chapter.topic_code,
                      label: chapter.name,
                    }))}
                    value={selectedChapters.map((code) => ({
                      value: code,
                      label: chapters.find((chapter) => chapter.topic_code === code)?.name
                    }))}
                    onChange={(selectedOptions) => {
                      setSelectedChapters(selectedOptions.map(option => option.value));
                    }}
                    classNamePrefix="react-select"
                    placeholder="Select Chapters"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group controlId="formQuestionType">
                  <Form.Label>Question Type</Form.Label>
                  <Form.Control
                    as="select"
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select Question Type</option>
                    <option value="solved">Solved</option>
                    <option value="exercise">Exercise</option>
                    <option value="external">External</option>
                  </Form.Control>
                </Form.Group>
              </Col>
              {questionType === 'external' && (
                <Col xs={12} md={6}>
                  <Form.Group controlId="formQuestionLevel">
                    <Form.Label>Question Level</Form.Label>
                    <Form.Control
                      as="select"
                      value={questionLevel}
                      onChange={(e) => setQuestionLevel(e.target.value)}
                      className="form-control"
                    >
                      <option value="">Select Level</option>
                      <option value="level-1">Level 1</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
              )}
            </Row>

            <div className="d-flex justify-content-end">
              <Button variant="primary" type="submit" className="btn-generate mt-3">
                Generate Questions
              </Button>
            </div>
          </Form>
        </div>
      </main>

      <QuestionListModal
        show={showQuestionList}
        onHide={handleClose}
        questionList={questionList}
        onQuestionClick={handleQuestionClick}
      />
    </div>
  );
}

export default StudentDash;
