import ProfileHeader from "../components/profile-header";
import ProfileContent from "../components/profile-content";

export default function ProfilePage() {
  return (
    <div className="container mx-auto space-y-6 px-4 py-10">
      <ProfileHeader />
      <ProfileContent />
    </div>
  );
}
