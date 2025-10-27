import { useParams, Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Show = () => {
  const { toast } = useToast();
  const { id } = useParams();

  const [video, setVideo] = useState(null);

  useEffect(() => {
    fetchVideo();
  }, [id]);

  const fetchVideo = async () => {
    try {
      const response = await api.get(`/technologist/videos/${id}`);
      setVideo(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Video olishda xatolik",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <Button variant="outline" asChild className="mb-4">
        <Link to="/technologist/videos">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Ortga qaytish
        </Link>
      </Button>
      <video src={video?.link} controls></video>
      <p className="text-lg font-semibold mt-4">ID: {video?.id}</p>
      <p className="text-lg">Nomi: {video?.title}</p>
    </div>
  );
};

export default Show;
