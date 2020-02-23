"use strict";
const { html, render, useReducer, useEffect } = window.htmPreact;

function getData(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (e) {
    return null;
  }
}

function usePersistentReducer(reducer, key, fallback) {
  const [data, dispatch] = useReducer(reducer, getData(key) || fallback);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, [data]);

  return [data, dispatch];
}

function appReducer({ questions, maxKey = 0 }, action) {
  switch (action.type) {
    case "ADD": {
      return {
        questions: [...questions, { ...action.payload, key: maxKey }],
        maxKey: maxKey + 1
      };
    }
    case "REMOVE": {
      return {
        questions: questions.filter(e => e.key != action.payload),
        maxKey
      };
    }
    default: {
      return { questions, maxKey };
    }
  }
}

function App() {
  const [{ questions }, dispatch] = usePersistentReducer(
    appReducer,
    "appState",
    { questions: [] }
  );
  return html`
    <div>
      <${ManageQuestions}
        add=${q => dispatch({ type: "ADD", payload: q })}
        remove=${key => dispatch({ type: "REMOVE", payload: key })}
        questions=${questions}
      />
      <${Series} questions=${questions} />
    </div>
  `;
}

function seriesReducer({ questions, started }, action) {
  switch (action.type) {
    case "START": {
      return {
        questions: shuffle(action.payload.slice()),
        started: true
      };
    }
    case "NEXT": {
      const [, ...rest] = questions;
      return {
        questions: rest,
        started
      };
    }
  }
}

function Series({ questions: storedQ }) {
  const [{ questions }, dispatch] = useReducer(seriesReducer, {
    questions: [],
    started: false
  });

  const start = () => dispatch({ type: "START", payload: storedQ });

  return html`
    <button type="button" onClick=${start}>
      Reset
    <//>
    ${questions.length
      ? html`
          <${FlashCard}
            question=${questions[0].q}
            answer=${questions[0].a}
            key=${questions[0].q}
          />
          <button type="button" onClick=${() => dispatch({ type: "NEXT" })}>
            Next
          </button>
        `
      : "💯"}
  `;
}

function shuffle(array) {
  // Shuffle using Fisher Yates algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function ManageQuestions({ add, remove, questions }) {
  return html`
    <details
      ><summary>Manage questions</summary>
      <${AddQuestion} add=${add} />
      <ul>
        ${questions.map(
          q =>
            html`
              <li key=${q.key}>
                <ul>
                  <li>${q.q}</li>
                  <li>${q.a}</li>
                </ul>
                <button onclick=${() => remove(q.key)}>Delete</button>
              </li>
            `
        )}
      </ul>
    </details>
  `;
}

function AddQuestion({ add }) {
  function onSumbit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    add({ q: formData.get("q"), a: formData.get("a") });
    form.reset();
  }

  return html`
    <form onsubmit=${onSumbit} autocomplete="off">
      <div>
        <label>Question: <input name="q"/></label>
      </div>
      <div>
        <label>Reponse: <input name="a"/></label>
      </div>
      <button>Add question</button>
    </form>
  `;
}

function FlashCard({ question, answer }) {
  const [isToggled, toggle] = useReducer(s => !s, false);

  return html`
    <div
      style=${{
        margin: 20,
        boxShadow: "0 1px 1px rgba(0,0,0,0.25)",
        border: `2px solid ${!isToggled ? "cyan" : "green"}`,
        borderRadius: 3,
        padding: "5px 10px",
        cursor: "pointer",
        textAlign: "center"
      }}
      onClick=${toggle}
    >
      <h6 style=${{ margin: 0 }}>${!isToggled ? "Question" : "Reponse"}<//>
      <div>${!isToggled ? question : answer}</div>
    <//>
  `;
}

render(
  html`
    <${App} />
  `,
  document.getElementById("root")
);