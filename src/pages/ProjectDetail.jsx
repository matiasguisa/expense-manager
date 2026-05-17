import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

import { db } from "../services/firebase";

function ProjectDetail() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [expenses, setExpenses] = useState([]);

  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitBetween, setSplitBetween] = useState([]);

  const [newParticipant, setNewParticipant] = useState("");

  useEffect(() => {
    loadProject();

    const expensesRef = collection(db, "projects", id, "expenses");

    const unsubscribe = onSnapshot(expensesRef, (snapshot) => {
      const expensesData = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setExpenses(expensesData);
    });

    return () => unsubscribe();
  }, []);

  const loadProject = async () => {
    const projectRef = doc(db, "projects", id);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
      const projectData = projectSnap.data();
      setProject(projectData);

      if (projectData.participants?.length > 0) {
        setPaidBy(projectData.participants[0]);
        setSplitBetween(projectData.participants);
      }
    }
  };

  const addParticipant = async () => {
    if (newParticipant.trim() === "") return;

    const updatedParticipants = [
      ...project.participants,
      newParticipant.trim(),
    ];

    await updateDoc(doc(db, "projects", id), {
      participants: updatedParticipants,
    });

    setNewParticipant("");
    setProject({ ...project, participants: updatedParticipants });
    setSplitBetween(updatedParticipants);
  };

  const deleteParticipant = async (participantName) => {
    const updatedParticipants = project.participants.filter(
      (p) => p !== participantName
    );

    await updateDoc(doc(db, "projects", id), {
      participants: updatedParticipants,
    });

    setProject({ ...project, participants: updatedParticipants });
    setSplitBetween(updatedParticipants);
  };

  const createExpense = async (e) => {
    e.preventDefault();

    if (concept.trim() === "" || amount === "" || paidBy === "") {
      alert("Completa todos los campos");
      return;
    }

    if (splitBetween.length === 0) {
      alert("Selecciona al menos un participante para dividir el gasto");
      return;
    }

    await addDoc(collection(db, "projects", id, "expenses"), {
      concept,
      amount: Number(amount),
      paidBy,
      splitBetween,
    });

    setConcept("");
    setAmount("");
  };

  const deleteExpense = async (expenseId) => {
    await deleteDoc(doc(db, "projects", id, "expenses", expenseId));
  };

  const toggleSplitParticipant = (participantName) => {
    if (splitBetween.includes(participantName)) {
      setSplitBetween(splitBetween.filter((p) => p !== participantName));
    } else {
      setSplitBetween([...splitBetween, participantName]);
    }
  };

  const totalExpenses = expenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  const calculateBalances = () => {
    const balances = {};

    project?.participants?.forEach((participant) => {
      balances[participant] = 0;
    });

    expenses.forEach((expense) => {
      const amountPerPerson = expense.amount / expense.splitBetween.length;

      expense.splitBetween.forEach((participant) => {
        balances[participant] -= amountPerPerson;
      });

      balances[expense.paidBy] += expense.amount;
    });

    return balances;
  };

  const balances = project ? calculateBalances() : {};

  return (
    <div>
      <h1>Detalle del proyecto</h1>

      <h2>{project?.title}</h2>

      <p>Participantes: {project?.participants?.join(", ")}</p>

      <hr />

      <h2>Gestión de participantes</h2>

      <input
        type="text"
        placeholder="Nuevo participante"
        value={newParticipant}
        onChange={(e) => setNewParticipant(e.target.value)}
      />

      <button onClick={addParticipant}>Añadir participante</button>

      <ul>
        {project?.participants?.map((participant, index) => (
          <li key={index}>
            {participant}
            <button onClick={() => deleteParticipant(participant)}>
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      <hr />

      <h2>Añadir gasto</h2>

      <form onSubmit={createExpense}>
        <input
          type="text"
          placeholder="Concepto"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
        />

        <input
          type="number"
          placeholder="Cantidad"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <h3>Pagado por</h3>

        <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
          {project?.participants?.map((participant, index) => (
            <option key={index} value={participant}>
              {participant}
            </option>
          ))}
        </select>

        <h3>Dividir entre</h3>

        {project?.participants?.map((participant, index) => (
          <label key={index} style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={splitBetween.includes(participant)}
              onChange={() => toggleSplitParticipant(participant)}
            />
            {participant}
          </label>
        ))}

        <button type="submit">Añadir gasto</button>
      </form>

      <hr />

      <h2>Lista de gastos</h2>

      {expenses.length === 0 ? (
        <p>No hay gastos todavía.</p>
      ) : (
        <ul>
          {expenses.map((expense) => (
            <li key={expense.id}>
              {expense.concept} - {expense.amount} € | Pagado por:{" "}
              {expense.paidBy} | Dividido entre:{" "}
              {expense.splitBetween?.join(", ")}
              <button onClick={() => deleteExpense(expense.id)}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      <hr />

      <h2>Resumen</h2>

      <p>Total gastos: {totalExpenses} €</p>

      {Object.entries(balances).map(([participant, balance]) => (
        <p key={participant}>
          {participant}:{" "}
          {balance > 0
            ? `debe recibir ${balance.toFixed(2)} €`
            : `debe pagar ${Math.abs(balance).toFixed(2)} €`}
        </p>
      ))}
    </div>
  );
}

export default ProjectDetail;