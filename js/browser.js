// ref -> https://www.digitalocean.com/community/tutorials/an-introduction-to-jquery

$(document).ready(function() {
    var ui = $(".ui"),
        sidebar = $(".ui__sidebar"),
        main = $(".ui__main"),
        uploadDrop = $(".upload-drop");
        
    // SIDEBAR TOGGLE
    $(".sidebar-toggle").on("click", function(e) {
        e.preventDefault();
        ui.toggleClass("ui__sidebar--open");
    });

    // MODAL
    $("[data-modal]").on("click", function(e) {
        e.preventDefault();
        var target = $(this).data("modal");
        openModal(target);
    });

    function openModal(id) {
        $("#" + id).toggleClass("info-modal--active");
        $('[data-modal="' + id + '"]').toggleClass("ui__btn--active");
    }

    // OVERLAY
    $("[data-overlay]").on("click", function(e) {
        e.preventDefault();
        var target = $(this).data("overlay");
        openOverlay(target);
    });

    // Close Overlay on Overlay Background Click
    $(".overlay").on("click", function(e) {
        if (e.target !== e.currentTarget) return;
        closeOverlay();
    });

    $(".overlay__close").on("click", function(e) {
        closeOverlay();
    });

    function openOverlay(id) {
        $("#" + id + ".overlay").addClass("overlay--active");
    }

    function closeOverlay() {
        $(".overlay--active").removeClass("overlay--active");
    }

    // Please doc this change--IMPORTANT
    $(document).on("click", ".folder", function(e) {
        console.log("happenings...")
        var t = $(this);
        var tree = t.closest(".file-tree__item");

        if (t.hasClass("folder--open")) {
            t.removeClass("folder--open");
            tree.removeClass("file-tree__item--open");
        } else {
            t.addClass("folder--open");
            tree.addClass("file-tree__item--open");
        }

        // Close all siblings
        tree
            .siblings()
            .removeClass("file-tree__item--open")
            .find(".folder--open")
            .removeClass("folder--open");
    });

    // DRAG & DROP
    var dc = 0;
    uploadDrop
        .on("dragover", function(e) {
        dc = 0;
        drag($(this), e);
    })
        .on("dragenter", function(e) {
        drag($(this), e);
        dc++;
    })
        .on("dragleave", function(e) {
        dragend($(this), e);
        dc--;
    })
        .on("drop", function(e) {
        drop($(this), e);
    });

    function drag(that, e) {
        e.preventDefault();
        e.stopPropagation();
        that.addClass("upload-drop--dragover");
    }

    function dragend(that, e) {
        e.preventDefault();
        e.stopPropagation();
        if (dc === 0) {
            $(".upload-drop--dragover").removeClass("upload-drop--dragover");
        }
    }

    function drop(that, e) {
        dc = 0;
        dragend($(this), e);
        // Handle file
        alert("It seems you dropped something!");
    }

    // SORTING
    function sortTable(n, method) {
        var table,
            rows,
            switching,
            i,
            x,
            y,
            shouldSwitch,
            dir,
            switchcount = 0;
        table = document.getElementById("file-table");
        switching = true;
        dir = "asc";

        while (switching) {
            switching = false;
            rows = table.getElementsByTagName("tr");

            for (i = 1; i < rows.length - 1; i++) {
                shouldSwitch = false;
                x = rows[i].getElementsByTagName("td")[n];
                y = rows[i + 1].getElementsByTagName("td")[n];

                if (method == "123") {
                    if (dir == "asc") {
                        if (parseFloat(x.innerHTML) > parseFloat(y.innerHTML)) {
                            shouldSwitch = true;
                            break;
                        }
                    } else if (dir == "desc") {
                        if (parseFloat(x.innerHTML) < parseFloat(y.innerHTML)) {
                            shouldSwitch = true;
                            break;
                        }
                    }
                } else {
                    if (dir == "asc") {
                        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                            shouldSwitch = true;
                            break;
                        }
                    } else if (dir == "desc") {
                        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                            shouldSwitch = true;
                            break;
                        }
                    }
                }
            }
            if (shouldSwitch) {
                rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                switching = true;
                switchcount++;
            } else {
                if (switchcount == 0 && dir == "asc") {
                    dir = "desc";
                    switching = true;
                }
            }
        }
    }

    var s3exp_lister = null;
    
    // populate side-bar with folders
    function s3list(completecb) {
        var params = {
            //Bucket: config.Bucket,
            //Prefix: config.Prefix,
            //Delimiter: config.Delimiter 
            Bucket: 'skynet23',
            Delimiter: '',
            Prefix: '' 
        };

        var scope = {
            Contents: [],
            CommonPrefixes: [],
            params: params,
            stop: false,
            completecb: completecb
        };

        return {
            // This is the callback that the S3 API makes when an S3 listObjects
            // request completes (successfully or in error). Note that a single call
            // to listObjects may not be enough to get all objects so we need to
            // check if the returned data is truncated and, if so, make additional
            // requests with a 'next marker' until we have all the objects.
            cb: function(err, data) {
                if (err) {
                    console.log('Error: ' + JSON.stringify(err));
                    console.log('Error: ' + err.stack);
                    scope.stop = true;
                    bootbox.alert("Error accessing S3 bucket " + scope.params.Bucket + ". Error: " + err);
                } else {
                    // console.log('Data: ' + JSON.stringify(data));
                    console.log("Options: " + $("input[name='optionsdepth']:checked").val());

                    // Store marker before filtering data
                    if (data.IsTruncated) {
                        if (data.NextMarker) {
                            scope.params.Marker = data.NextMarker;
                        } else if (data.Contents.length > 0) {
                            scope.params.Marker = data.Contents[data.Contents.length - 1].Key;
                        }
                    }

                    // Filter the folders out of the listed S3 objects
                    // (could probably be done more efficiently)
                    console.log("Filter: remove folders");
                    data.Contents = data.Contents.filter(function(el) {
                        return el.Key !== scope.params.Prefix;
                    });

                    // Accumulate the S3 objects and common prefixes
                    scope.Contents.push.apply(scope.Contents, data.Contents);
                    scope.CommonPrefixes.push.apply(scope.CommonPrefixes, data.CommonPrefixes);

                    if (scope.stop) {
                        console.log('Bucket ' + scope.params.Bucket + ' stopped');
                    } else if (data.IsTruncated) {
                        console.log('Bucket ' + scope.params.Bucket + ' truncated');
                        s3.makeUnauthenticatedRequest('listObjects', scope.params, scope.cb);
                    } else {
                        console.log('Bucket ' + scope.params.Bucket + ' has ' + scope.Contents.length + ' objects, including ' + scope.CommonPrefixes.length + ' prefixes');
                        delete scope.params.Marker;
                        if (scope.completecb) {
                            scope.completecb(scope, true);
                        }
                    }
                }
            },

            // Start the spinner, clear the table, make an S3 listObjects request
            go: function() {
                scope.cb = this.cb;
                s3.makeUnauthenticatedRequest('listObjects', scope.params, this.cb);
            },

            stop: function() {
                scope.stop = true;
                delete scope.params.Marker;
                if (scope.completecb) {
                    scope.completecb(scope, false);
                }
            }
        };
    }

    function s3draw(data, complete) {
        folder2breadcrumbs(data);

        // Add each part of current path (S3 bucket plus folder hierarchy) into the breadcrumbs
        $.each(data.CommonPrefixes, function(i, prefix) {
            $('.').DataTable().rows.add([{
                Key: prefix.Prefix
            }]);
        });

        // Add S3 objects to DataTable
        $('.').DataTable().rows.add(data.Contents).draw();
    }

    var counter = 0;
    //(s3exp_lister = s3list(s3draw)).go();
    $(".file-tree").append(
        '<li class="file-tree__item">'
        + '<div class="folder">'
        + "Watcha"
        + '</div>'
        + '</li>'
    )

});
