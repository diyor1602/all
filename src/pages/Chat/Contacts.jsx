import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Contacts = () => {
  const { toast } = useToast();

  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // Pagination refs
  const pageRef = useRef(1);
  const lastPageRef = useRef(null);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const abortControllerRef = useRef(null);

  // --- Fetch Page ---
  const fetchPage = useCallback(
    async (page = 1, { reset = false } = {}) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (reset) {
        setContacts([]);
        pageRef.current = 1;
        hasMoreRef.current = true;
        lastPageRef.current = null;
      }

      // cancel previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        if (page === 1 && reset) setInitialLoading(true);
        else setLoading(true);

        const response = await api.get("/contacts", {
          params: { page, search: search || undefined },
          signal: abortControllerRef.current.signal,
        });

        const data = response.data?.data || [];
        const pagination = response.data || {};

        lastPageRef.current = pagination.last_page?.[0] || null;
        pageRef.current = page;
        hasMoreRef.current = pagination.next !== null;

        setContacts((prev) => (reset ? data : [...prev, ...data]));
      } catch (error) {
        if (error.name !== "CanceledError") {
          toast({
            variant: "destructive",
            title: "Xatolik",
            description: "Kontaktlarni olishda xatolik yuz berdi",
          });
        }
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [search, toast]
  );

  // keep latest fetchPage in ref to avoid debounce issues
  const fetchPageRef = useRef(fetchPage);
  useEffect(() => {
    fetchPageRef.current = fetchPage;
  }, [fetchPage]);

  // --- Initial Load ---
  useEffect(() => {
    fetchPage(1, { reset: true });
  }, []);

  // --- Infinite Scroll ---
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const ent = entries[0];
        if (!ent || !ent.isIntersecting) return;

        if (initialLoading || contacts.length === 0) return;

        if (!isFetchingRef.current && hasMoreRef.current) {
          const nextPage = (pageRef.current || 1) + 1;
          if (!lastPageRef.current || nextPage <= lastPageRef.current) {
            fetchPageRef.current(nextPage);
          }
        }
      },
      {
        root: null,
        rootMargin: "300px",
        threshold: 0.1,
      }
    );

    const el = sentinelRef.current;
    if (el) observerRef.current.observe(el);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [initialLoading, contacts.length]);

  // --- Debounced Search ---
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPageRef.current(1, { reset: true });
    }, 500); // wait 500ms after typing stops

    return () => clearTimeout(handler);
  }, [search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  return (
    <div className="p-6">
      {/* Header + Search */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/chat">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Kontaktlarni qidirish..."
            className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Contacts List */}
      {initialLoading ? (
        <div className="flex justify-center items-center h-[70vh]">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {contacts.length === 0 ? (
            <div className="text-center text-gray-500">
              Kontaktlar topilmadi
            </div>
          ) : (
            contacts.map((contact) => (
              <Link
                key={contact.id}
                to={`/chat/personal/${contact.user_id}`}
                className="flex items-center gap-3 p-3 bg-white shadow-sm rounded-lg border hover:shadow-md transition"
              >
                {contact.img ? (
                  <img
                    src={contact.img}
                    alt={contact.name}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="text-sm font-medium">{contact.name}</div>
                  <div className="text-xs text-gray-500">
                    {contact.department?.name}
                    {contact.group?.name && ` | ${contact.group?.name}`}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {loading && !initialLoading && (
        <div className="flex justify-center items-center py-6">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      )}

      <div ref={sentinelRef} className="h-10" />
    </div>
  );
};

export default Contacts;
