import React, { createContext, useContext } from 'react';

const TeamChatContext = createContext({
  onOpenTeamChat: null,
  unreadMessages: 0,
  impersonatedCompanyId: null
});

export const TeamChatProvider = ({ children, value }) => {
  return (
    <TeamChatContext.Provider value={value}>
      {children}
    </TeamChatContext.Provider>
  );
};

export const useTeamChat = () => {
  const context = useContext(TeamChatContext);
  return context;
};

export default TeamChatContext;

