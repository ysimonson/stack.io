var MOUSE_UPDATE_RATE = 10;

stack.io({host: "http://localhost:8080", timeout: 5}, function(error, client) {
    if(error) {
        console.error(error);
        return;
    }

    client.login("demo", "demo-password", function(error) {
        if(error) {
            console.error(error);
            return;
        }

        client.use("mice", function(error, context) {
            if(error) {
                console.error(error);
                return;
            }

            var myClientId = null;

            context.listen(function(error, event) {
                if(error) {
                    console.error(error);
                } else if(event.type === "initial") {
                    myClientId = event.id;
                    updateCount(event.count);
                    startUpdating(context, myClientId);
                } else if(event.type === "updates") {
                    for(var i=0; i<event.payload.length; i++) {
                        var update = event.payload[i];

                        if(update.type === "move") {
                            //if(myClientId !== update.value.id) {
                            moveMouse(update.value.id, update.value.pos);
                            //}
                        } else if(update.type === "stats") {
                            updateCount(update.value);
                        } else if(update.type === "unlisten") {
                            removeMouse(update.value);
                        }
                    }
                }
            });
        });
    });
});

function moveMouse(id, pos) {
    var sel = $("#pointer-" + id);

    if(sel.length === 0) {
        sel = $("<div class='mouse'>").attr("id", "pointer-" + id);
        $("body").append(sel);
    }

    sel.css({ left: pos[0], top: pos[1] });
}

function removeMouse(id) {
    $("#pointer-" + id).remove();
}

function updateCount(count) {
    $("#statsClientConnected").text(count);
}

function startUpdating(mice, id) {
    var x = null, y = null, updated = false;

    $(document).mousemove(function(e) {
        if(e.pageX !== x || e.pageY !== y) {
            updated = true;
            x = e.pageX;
            y = e.pageY;
        }
    });

    setInterval(function() {
        if(updated) {
            updated = false;

            mice.move(id, x, y, function(error) {
                if(error) console.error(error);
            });
        }
    }, MOUSE_UPDATE_RATE);
}