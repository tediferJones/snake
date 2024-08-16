# snake

### THE PLAN

1. Setup basic web server with websocket capabilities
    - Using Bun will allow us to avoid using microservices

2. Setup initial page render
    - Prompt user to join a game, use websockets to maintain game state
        - We could use URL params in the websocket connection URL to handle game connection
            - How do we want to handle a failed game connection? (refresh and/or send back to home page)
        - Alternatively we could just send a fetch request
    - We can have 2 game types, 'general' and 'private'
    - Private games can be connected to by entering the correct gameCode (a random length 5 string)

3. Handle creation and joining of games
    - If gameCode does not exist, create the game
    - If gameCode does exist, add user to that game
    - Probably a good idea just to get single player games working before working on the multiplayer aspect
        - Game board size will have to increase for each player that joins the game while also maintaining the same ratio
    - We will use setInterval to establish tick rate for server
        - At every interval, send current game state to all connected users

4. How do we want to handle game over state?
    - Each game could be a one and done
    - Alternatively we could allow each player to vote for a rematch once the game has ended
        - Speaking of which, do we want to be able to pause game start until all players agree to start?
        - This could create a lobby type of affect

