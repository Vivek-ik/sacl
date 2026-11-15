export function configureScoringSocket(io) {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("match:join", (matchId) => {
      if (!matchId) return;

      const room = `match:${String(matchId)}`;

      socket.join(room);

      console.log(`${socket.id} joined room: ${room}`);
    });

    socket.on("match:leave", (matchId) => {
      if (!matchId) return;

      const room = `match:${String(matchId)}`;

      socket.leave(room);

      console.log(`${socket.id} left room: ${room}`);
    });
  });
}
