import React from 'react';
import { LifeDbProvider, useLifeDb } from './context/LifeDbContext';
import { Navbar } from './components/Navbar';
import { DayTimeline } from './components/DayTimeline';
import { WeekCalendar } from './components/WeekCalendar';
import { MonthCalendar } from './components/MonthCalendar';
import { LifeDbTable } from './components/LifeDbTable';
import { SssgdwBalanceRadar } from './components/SssgdwBalanceRadar';
import { MasterGoals } from './components/MasterGoals';
import { OverdueReminderBanner } from './components/OverdueReminderBanner';
import { JarvisChat } from './components/JarvisChat';
import { SkipModal } from './components/SkipModal';
import { EditEventModal } from './components/EditEventModal';
import './styles/app.css';

function MainApp() {
  const { currentView, selectedAreaFilter } = useLifeDb();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="main-layout" style={{ flex: 1, padding: '20px 24px' }}>
        {currentView === 'day' && (
          <>
            <DayTimeline selectedAreaFilter={selectedAreaFilter} />
            <SssgdwBalanceRadar />
          </>
        )}

        {currentView === 'week' && <WeekCalendar />}

        {currentView === 'month' && <MonthCalendar />}

        {currentView === 'table' && <LifeDbTable />}

        {currentView === 'goals' && <MasterGoals />}
      </main>

      {/* Floating Overlays */}
      <JarvisChat />
      <SkipModal />
      <EditEventModal />
    </div>
  );
}

export default function App() {
  return (
    <LifeDbProvider>
      <MainApp />
    </LifeDbProvider>
  );
}
