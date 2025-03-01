Object subclass: ChatServer [
    | messages |

    ChatServer class >> startServer [
        "Start a simple HTTP server on port 8080"
        | server |
        server := ZnServer startOn: 8080.
        server delegate: ChatServer new.
        server start.
        ^ server.
    ]

    ChatServer >> initialize [
        messages := OrderedCollection new.
    ]

    ChatServer >> handleRequest: request [
        | response body |
        request method = #POST ifTrue: [
            messages add: (request contents asString).
        ].
        body := ZnStringEntity text: (messages joinSeparatedBy: '\n').
        response := ZnResponse ok: body.
        ^ response.
    ]
]
