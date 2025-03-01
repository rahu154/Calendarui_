import axios from "axios";
import { format, getDay, parse, startOfWeek } from "date-fns";
import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./CalendarComponent.css";

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarComponent = () => {
  const [events, setEvents] = useState([]);
  const [groupedEvents, setGroupedEvents] = useState({});
  const [view, setView] = useState(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [resume, setResume] = useState(null);
  const [aadhar, setAadhar] = useState(null);
  const [expandedDate, setExpandedDate] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    start: "",
    end: "",
    position: "",
    candidate: "",
    meetingLink: "",
    interviewType: "",
    interviewer: "",
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get("/calendarfromtoenddate.json");
        const formattedEvents = response.data.map((event) => ({
          id: event.id,
          title: event.summary,
          start: new Date(event.start),
          end: new Date(event.end),
          position: event.job_id.jobRequest_Title,
          createdBy: `${event.user_det.handled_by.firstName} ${event.user_det.handled_by.lastName}`,
          candidate: `${event.user_det.candidate.candidate_firstName} ${event.user_det.candidate.candidate_lastName}`,
          meetingLink: event.link,
          interviewType: event.summary,
          interviewer: `${event.user_det.handled_by.firstName} ${event.user_det.handled_by.lastName}`,
          attachments: event.attachments || [],
        }));
        setEvents(formattedEvents);
        setGroupedEvents(groupEventsByDate(formattedEvents));
      } catch (error) {
        console.error("Error fetching calendar events:", error);
      }
    };

    fetchEvents();
  }, []);

  const groupEventsByDate = (events) => {
    const groups = {};
    events.forEach((event) => {
      const dateKey = format(event.start, "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });
    return groups;
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleExpandClick = (date) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setNewEvent({
      title: event.title,
      start: format(event.start, "yyyy-MM-dd'T'HH:mm"),
      end: format(event.end, "yyyy-MM-dd'T'HH:mm"),
      position: event.position,
      candidate: event.candidate,
      meetingLink: event.meetingLink,
      interviewType: event.interviewType,
      interviewer: event.interviewer,
    });
    setShowForm(true);
  };

  const handleDeleteEvent = (event) => {
    const updatedEvents = events.filter((e) => e.id !== event.id);
    setEvents(updatedEvents);
    setGroupedEvents(groupEventsByDate(updatedEvents));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });
  };

  const handleCreateEvent = (e) => {
    e.preventDefault();
    const event = {
      id: events.length + 1,
      ...newEvent,
      start: new Date(newEvent.start),
      end: new Date(newEvent.end),
    };
    setEvents([...events, event]);
    setGroupedEvents(groupEventsByDate([...events, event]));
    setShowForm(false);
    setNewEvent({
      title: "",
      start: "",
      end: "",
      position: "",
      candidate: "",
      meetingLink: "",
      interviewType: "",
      interviewer: "",
    });
  };

  const handleUpdateEvent = (e) => {
    e.preventDefault();
    const updatedEvents = events.map((event) =>
      event.id === selectedEvent.id ? { ...event, ...newEvent } : event
    );
    setEvents(updatedEvents);
    setGroupedEvents(groupEventsByDate(updatedEvents));
    setShowForm(false);
    setSelectedEvent(null);
  };

  const EventComponent = ({ event }) => {
    const dateKey = format(event.start, "yyyy-MM-dd");
    const eventsCount = groupedEvents[dateKey]?.length || 0;

    return (
      <div className="custom-event">
        {eventsCount > 1 && (
          <div className="event-count-badge">{eventsCount}</div>
        )}
        <button
          className="event-expand-button"
          onClick={(e) => {
            e.stopPropagation();
            handleExpandClick(dateKey);
          }}
        >
          ›
        </button>
        <div className="event-main-content">
          <strong>{event.title}</strong>
          <div>{format(event.start, "hh:mm a")}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container" style={{ height: "100vh" }}>
      <div className="calendar-header">
        <h2>YOUR TODO'S</h2>
        <button className="create-schedule" onClick={() => setShowForm(true)}>
          + New Schedule
        </button>
      </div>

      {showForm && (
        <div className="event-form-modal">
          <div className="modal-content">
            <button className="close-button" onClick={() => setShowForm(false)}>
              ×
            </button>
            <h3>{selectedEvent ? "Edit Event" : "Create New Event"}</h3>
            <form
              onSubmit={selectedEvent ? handleUpdateEvent : handleCreateEvent}
            >
              <label>
                Title:
                <input
                  type="text"
                  name="title"
                  value={newEvent.title}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Start Date and Time:
                <input
                  type="datetime-local"
                  name="start"
                  value={newEvent.start}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                End Date and Time:
                <input
                  type="datetime-local"
                  name="end"
                  value={newEvent.end}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Position:
                <input
                  type="text"
                  name="position"
                  value={newEvent.position}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Candidate:
                <input
                  type="text"
                  name="candidate"
                  value={newEvent.candidate}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Meeting Link:
                <input
                  type="url"
                  name="meetingLink"
                  value={newEvent.meetingLink}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Interview Type:
                <input
                  type="text"
                  name="interviewType"
                  value={newEvent.interviewType}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Interviewer:
                <input
                  type="text"
                  name="interviewer"
                  value={newEvent.interviewer}
                  onChange={handleInputChange}
                />
              </label>
              <button type="submit">
                {selectedEvent ? "Update Event" : "Create Event"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="calendar-wrapper" style={{ height: "calc(100% - 60px)" }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%", width: "75%" }}
          onSelectEvent={handleEventClick}
          view={view}
          onView={setView}
          date={currentDate}
          onNavigate={setCurrentDate}
          components={{
            event: EventComponent,
          }}
          selectable={false} // Make the calendar read-only
        />

        {expandedDate && groupedEvents[expandedDate]?.length > 1 && (
          <div className="events-sidebar">
            <h3>Events on {format(new Date(expandedDate), "dd MMM yyyy")}</h3>
            {groupedEvents[expandedDate].map((event, index) => (
              <div key={event.id} className="sidebar-event">
                <button
                  className="event-details-button"
                  onClick={() => setSelectedEvent(event)}
                >
                  ›
                </button>
                <div className="sidebar-event-content">
                  <div>{event.title}</div>
                  <div className="event-time">
                    {format(event.start, "hh:mm a")} -{" "}
                    {format(event.end, "hh:mm a")}
                  </div>
                  <div className="event-actions">
                    <button
                      className="edit-button"
                      onClick={() => handleEditEvent(event)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteEvent(event)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="event-modal">
          <div className="modal-content">
            <button
              className="close-button"
              onClick={() => setSelectedEvent(null)}
            >
              ×
            </button>
            <h3>{selectedEvent.title}</h3>
            <div style={{ display: "flex", height: "210px" }}>
              <div>
                <p>
                  <strong>Candidate:</strong> {selectedEvent.candidate}
                </p>
                <p>
                  <strong>Position:</strong> {selectedEvent.position}
                </p>
                <p>
                  <strong>Interview Type:</strong> {selectedEvent.interviewType}
                </p>
                <p>
                  <strong>Interviewer:</strong> {selectedEvent.interviewer}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {format(selectedEvent.start, "dd MMM yyyy")}
                </p>
                <p>
                  <strong>Time:</strong>{" "}
                  {format(selectedEvent.start, "hh:mm a")} -{" "}
                  {format(selectedEvent.end, "hh:mm a")}
                </p>
              </div>

              <div className="separator"></div>

              <div>
                {selectedEvent.meetingLink && (
                  <div className="meet-section">
                    <div>
                      <img src="googlemeet.jpeg" alt="Google Meet" width="70" />
                    </div>
                    <div>
                      <a
                        href={selectedEvent.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <button className="join-button">JOIN</button>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="file-section">
              <h4>Document Upload:</h4>
              <div className="file-inputs">
                <label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResume(e.target.files[0])}
                  />
                  Upload Resume
                </label>
                <label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.png"
                    onChange={(e) => setAadhar(e.target.files[0])}
                  />
                  Upload Aadhar
                </label>
              </div>
              <div className="uploaded-files">
                {resume && (
                  <div className="file-item">
                    <span>{resume.name}</span>
                    <a
                      href={URL.createObjectURL(resume)}
                      download={resume.name}
                    >
                      <button className="download-button">Download</button>
                    </a>
                  </div>
                )}
                {aadhar && (
                  <div className="file-item">
                    <span>{aadhar.name}</span>
                    <a
                      href={URL.createObjectURL(aadhar)}
                      download={aadhar.name}
                    >
                      <button className="download-button">Download</button>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarComponent;
