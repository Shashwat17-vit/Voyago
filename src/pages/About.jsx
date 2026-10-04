import { Container } from 'react-bootstrap';
import {
  Calendar, Map, MapPin, MessageCircle, Settings, Sparkles, UserPlus, Users,
} from 'lucide-react';
import TopNavbar from '../components/TopNavbar';
import './Home.css';
import './About.css';

const FEATURES = [
  {
    icon: MapPin,
    title: 'Plan from Home',
    body: 'Search a destination and date, then start a trip without leaving the home page.',
  },
  {
    icon: Sparkles,
    title: 'Generated itinerary',
    body: 'Preferences and at least three interests produce a day-by-day plan you can edit.',
  },
  {
    icon: Calendar,
    title: 'Calendar',
    body: 'Review the trip by day or week, add events, and change time, place, and notes.',
  },
  {
    icon: Map,
    title: 'Map',
    body: 'See the stops on the itinerary placed on a map for that trip.',
  },
  {
    icon: MessageCircle,
    title: 'Group chat',
    body: 'Talk with the people on the trip from the Chat tab.',
  },
  {
    icon: UserPlus,
    title: 'Invites',
    body: 'Invite travelers while creating a trip, or later from Invite Guests. Pending invites show on Home.',
  },
  {
    icon: Users,
    title: 'Guest drafts',
    body: 'Start planning before you have an account. Sign up to keep the draft as a real trip.',
  },
  {
    icon: Settings,
    title: 'Settings',
    body: 'Change profile, appearance, and account preferences from the avatar menu.',
  },
];

function About() {
  return (
    <div className="home-v2">
      <TopNavbar />
      <Container className="about-page">
        <div className="text-center">
          <h1 className="about-title">About Voyago</h1>
          <p className="about-lead">
            Voyago takes the stress out of trip planning so you can focus on the people you are traveling with.
          </p>
        </div>

        <section className="about-docs">
          <h2>What you can do</h2>
          <div className="about-grid">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="about-card">
                <h3><Icon size={18} />{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}

export default About;
