import { Link, useLocation } from "wouter";

const EventTabs = () => {
  const [location] = useLocation();
  
  const tabs = [
    { name: "My Events", href: "/myevents" },
    { name: "Upcoming", href: "/myevents/upcoming" },
    { name: "Invitations", href: "/myevents/invitations" },
    { name: "Past Events", href: "/myevents/past" },
  ];
  
  return (
    <div className="mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map(tab => (
            <Link key={tab.name} href={tab.href}>
              <a
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${location === tab.href 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.name}
              </a>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default EventTabs;
