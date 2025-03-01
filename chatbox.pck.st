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
        | response body json |
        
        request method = #POST ifTrue: [
            json := NeoJSONReader fromString: request contents.
            messages add: json.
        ].
        
        body := NeoJSONWriter toString: messages.
        response := ZnResponse ok: body.
        response contentType: 'application/json'.
        
        ^ response.
    ]
]
