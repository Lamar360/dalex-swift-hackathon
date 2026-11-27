import { BrowserRouter, Link, Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./screens/Dashboard";
import { Discover } from "./screens/Discover";
import { Guests } from "./screens/Guests";
import { Refer } from "./screens/Refer";
import { SaveTrip } from "./screens/SaveTrip";
import { Staff } from "./screens/Staff";
import { Venue } from "./screens/Venue";

function NotFound() {
  return (
    <div className="card space-y-3">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link to="/" className="btn-primary">
        Back to start
      </Link>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Discover />} />
          <Route path="venue" element={<Venue />} />
          <Route path="trip" element={<SaveTrip />} />
          <Route path="refer" element={<Refer />} />
          <Route path="staff" element={<Staff />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="guests" element={<Guests />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
