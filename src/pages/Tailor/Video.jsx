const Video = () => {
  return (
    <div className="w-full min-h-[90vh] flex items-center justify-center">
      <video controls className="w-full max-h-[90vh] object-contain">
        <source
          src="https://www.dropbox.com/scl/fi/zwg01x37ompp6xdmgh43i/video_2025-08-06_16-21-06.mp4?rlkey=389y8quxkkdl3j1f3id0dd1ym&st=vbz4rxax&raw=1"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default Video;
