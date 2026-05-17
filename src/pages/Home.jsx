import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { Link } from "react-router-dom";

import { auth, db } from "../services/firebase";

function Home() {
  const [title, setTitle] = useState("");
  const [participant, setParticipant] = useState("");
  const [participants, setParticipants] = useState([]);
  const [projects, setProjects] = useState([]);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "projects"),
      where("ownerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProjects(projectsData);
    });

    return () => unsubscribe();
  }, [user]);

  const addParticipant = () => {
    if (participant.trim() === "") return;

    setParticipants([...participants, participant.trim()]);
    setParticipant("");
  };

  const createProject = async (e) => {
    e.preventDefault();

    if (title.trim() === "") {
      alert("El título es obligatorio");
      return;
    }

    const userName = user.email;

    const finalParticipants = [
      userName,
      ...participants.filter((p) => p !== userName),
    ];

    await addDoc(collection(db, "projects"), {
      title,
      ownerId: user.uid,
      ownerEmail: user.email,
      participants: finalParticipants,
      createdAt: new Date(),
    });

    setTitle("");
    setParticipants([]);
  };

  const deleteProject = async (projectId) => {
    const confirmDelete = confirm("¿Seguro que quieres eliminar este proyecto?");

    if (!confirmDelete) return;

    await deleteDoc(doc(db, "projects", projectId));
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div>
      <h1>Expense Manager</h1>

      <p>Usuario autenticado: {user?.email}</p>

      <button onClick={handleLogout}>Logout</button>

      <hr />

      <h2>Crear proyecto</h2>

      <form onSubmit={createProject}>
        <input
          type="text"
          placeholder="Título del proyecto"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <h3>Participantes adicionales</h3>

        <input
          type="text"
          placeholder="Nombre participante"
          value={participant}
          onChange={(e) => setParticipant(e.target.value)}
        />

        <button type="button" onClick={addParticipant}>
          Añadir participante
        </button>

        <ul>
          {participants.map((p, index) => (
            <li key={index}>{p}</li>
          ))}
        </ul>

        <button type="submit">Crear proyecto</button>
      </form>

      <hr />

      <h2>Mis proyectos</h2>

      {projects.length === 0 ? (
        <p>No hay proyectos creados.</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <strong>{project.title}</strong>{" "}
              <Link to={`/project/${project.id}`}>Ver detalle</Link>{" "}
              <button onClick={() => deleteProject(project.id)}>
                Eliminar
              </button>

              <p>Participantes: {project.participants?.join(", ")}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Home;