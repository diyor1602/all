import { useEffect, useMemo, useState } from "react";
import api from "./utils/api";
import { useToast } from "./components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  Loader2,
  X,
  Search,
  Clock,
  AlertCircle,
} from "lucide-react";

const formatDateTime = (date) => {
  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const Todo = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | pending | done
  const [confirmTodo, setConfirmTodo] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  const [editingId, setEditingId] = useState(null);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await api.get("/todos");
      setData(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Todolarni olishda xatolik bo'ldi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ title: "", description: "", due_date: "" });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title) {
      toast({ title: "Title kiritilmadi", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);

      if (editingId) {
        await api.put(`/todos/${editingId}`, form);
        toast({ title: "Todo yangilandi" });
      } else {
        await api.post("/todos", {
          ...form,
          is_done: false,
        });
        toast({ title: "Todo qo'shildi" });
      }

      resetForm();
      fetchTodos();
    } catch (error) {
      toast({ title: "Xatolik", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/todos/${id}`);
      setData((prev) => prev.filter((item) => item.id !== id));
      toast({ title: "Todo o'chirildi" });
    } catch (error) {
      toast({ title: "O'chirishda xatolik", variant: "destructive" });
    }
  };

  const confirmToggle = async () => {
    if (!confirmTodo) return;

    try {
      await api.put(`/todos/${confirmTodo.id}`, {
        ...confirmTodo,
        is_done: !confirmTodo.is_done,
      });

      setData((prev) =>
        prev.map((item) =>
          item.id === confirmTodo.id
            ? { ...item, is_done: !item.is_done }
            : item,
        ),
      );

      setConfirmTodo(null);
      toast({ title: "Status o'zgartirildi" });
    } catch (error) {
      toast({ title: "Xatolik", variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await api.delete(`/todos/${deleteConfirm.id}`);
      setData((prev) => prev.filter((item) => item.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      toast({ title: "Todo o'chirildi" });
    } catch (error) {
      toast({ title: "O'chirishda xatolik", variant: "destructive" });
    }
  };

  const handleEdit = (todo) => {
    setForm({
      title: todo.title,
      description: todo.description,
      due_date: todo.due_date,
    });
    setEditingId(todo.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Search + filter + sort
  const filteredData = useMemo(() => {
    let list = [...data];

    if (search) {
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(search.toLowerCase()) ||
          t.description?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (filter === "pending") {
      list = list.filter((t) => !t.is_done);
    }

    if (filter === "done") {
      list = list.filter((t) => t.is_done);
    }

    // pending first, then sort by due_date asc
    list.sort((a, b) => {
      if (a.is_done !== b.is_done) return a.is_done ? 1 : -1;

      if (!a.due_date) return 1;
      if (!b.due_date) return -1;

      return new Date(a.due_date) - new Date(b.due_date);
    });

    return list;
  }, [data, search, filter]);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Todo List</h1>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border shadow-sm rounded-2xl p-5 mb-6 space-y-4"
      >
        <div className="grid md:grid-cols-3 gap-4">
          <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
            className="border rounded-xl px-3 py-2 w-full"
          />

          <input
            name="due_date"
            type="datetime-local"
            value={form.due_date}
            onChange={handleChange}
            className="border rounded-xl px-3 py-2 w-full"
          />
        </div>

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="border rounded-xl px-3 py-2 w-full"
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {editingId ? "Yangilash" : "Qo'shish"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 border px-4 py-2 rounded-xl"
            >
              <X className="w-4 h-4" /> Bekor qilish
            </button>
          )}
        </div>
      </form>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex items-center border rounded-xl px-3 py-2 w-full bg-white">
          <Search className="w-4 h-4 mr-2 text-gray-500" />
          <input
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none w-full bg-transparent"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl border ${
              filter === "all" ? "bg-black text-white" : ""
            }`}
          >
            Barchasi
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-xl border ${
              filter === "pending" ? "bg-black text-white" : ""
            }`}
          >
            Bajarilmagan
          </button>
          <button
            onClick={() => setFilter("done")}
            className={`px-4 py-2 rounded-xl border ${
              filter === "done" ? "bg-black text-white" : ""
            }`}
          >
            Yakunlangan
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Todo mavjud emas</div>
        ) : (
          <div className="divide-y">
            <AnimatePresence>
              {filteredData.map((todo) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setConfirmTodo(todo)}
                      className={`w-6 h-6 rounded-full border flex items-center justify-center whitespace-nowrap shrink-0 ${
                        todo.is_done
                          ? "bg-green-500 text-white border-green-500"
                          : ""
                      }`}
                    >
                      {todo.is_done && <Check className="w-4 h-4" />}
                    </button>

                    <div>
                      <h3
                        className={`font-medium ${
                          todo.is_done ? "line-through text-gray-400" : ""
                        }`}
                      >
                        {todo.title}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {todo.description}
                      </p>

                      {todo.due_date && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(todo.due_date)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(todo)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirm(todo)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmTodo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-96 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="text-yellow-500" />
                <h2 className="font-semibold">Tasdiqlash</h2>
              </div>

              <p className="text-sm text-gray-600 mb-5">
                Siz bu ishning statusini o'zgartirmoqchimisiz?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmTodo(null)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Bekor qilish
                </button>

                <button
                  onClick={confirmToggle}
                  className="px-4 py-2 bg-black text-white rounded-xl"
                >
                  Tasdiqlash
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Dialog */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-96 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="text-red-500" />
                <h2 className="font-semibold">O'chirishni tasdiqlash</h2>
              </div>

              <p className="text-sm text-gray-600 mb-5">
                Siz "{deleteConfirm.title}" todoni o'chirmoqchimisiz? Bu amal
                ortga qaytarib bo'lmaydi.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Bekor qilish
                </button>

                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl"
                >
                  O'chirish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Todo;
