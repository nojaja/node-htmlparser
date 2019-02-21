export class DomUtils {
    //Properties//
    //Methods//
    static testAttribute(option, attributes) {
        for (var i = 0; i < attributes.length; i++) {
        if (option(attributes[i].data)) return true;
        }
        return false;
    }
    static testElement(options, element) {
        if (!element) {
        return false;
        }

        for (var key in options) {
        if (!options.hasOwnProperty(key)) {
            continue;
        }
        if (key == "tag_name") {
            if (element.type !== Mode.Tag) {
            return false;
            }
            if (!options["tag_name"](element.name)) {
            return false;
            }
        } else if (key == "tag_type") {
            if (!options["tag_type"](element.type)) {
            return false;
            }
        } else if (key == "tag_contains") {
            if (
            element.type !== Mode.Text &&
            element.type !== Mode.Comment &&
            element.type !== Mode.CData
            ) {
            return false;
            }
            if (!options["tag_contains"](element.data)) {
            return false;
            }
        } else {
            //if (!element.attributes || !element.attributes[key] || !options[key](element.attributes[key].value)) {
            if (
            !element.attributes ||
            !element.attributes[key] ||
            !DomUtils.testAttribute(options[key], element.attributes[key])
            ) {
            return false;
            }
        }
        }

        return true;
    }

    static getElements(
        options,
        currentElement,
        recurse,
        limit
    ) {
        
        let setPrototypeOfDomUtils = function(array) {};
        recurse = recurse === undefined || recurse === null || !!recurse;
        limit = isNaN(parseInt(limit)) ? -1 : parseInt(limit);

        var found = [];
        var elementList;
        setPrototypeOfDomUtils(found);

        if (!currentElement) {
        return found;
        }

        function getTest(checkVal) {
        return function (value) {
            return value == checkVal;
        };
        }
        for (var key in options) {
        if (typeof options[key] != "function") {
            options[key] = getTest(options[key]);
        }
        }

        if (DomUtils.testElement(options, currentElement)) {
        found.push(currentElement);
        }

        if (limit >= 0 && found.length >= limit) {
        return found;
        }

        if (recurse && currentElement.children) {
        elementList = currentElement.children;
        } else if (currentElement instanceof Array) {
        elementList = currentElement;
        } else {
        return found;
        }

        for (var i = 0; i < elementList.length; i++) {
        found = found.concat(
            DomUtils.getElements(options, elementList[i], recurse, limit)
        );
        if (limit >= 0 && found.length >= limit) {
            break;
        }
        }

        return found;
    }

    static getElementById(
        id,
        currentElement,
        recurse
    ) {
        var result = DomUtils.getElements({ id: id }, currentElement, recurse, 1);
        return result.length ? result[0] : null;
    }

    static getElementsByTagName(
        name,
        currentElement,
        recurse,
        limit
    ) {
        return DomUtils.getElements(
        { tag_name: name },
        currentElement,
        recurse,
        limit
        );
    }

    static getElementsByTagType(
        type,
        currentElement,
        recurse,
        limit
    ) {
        return DomUtils.getElements(
        { tag_type: type },
        currentElement,
        recurse,
        limit
        );
    }

    static removeChild(element, currentElement) {
        for (var i = 0; i < currentElement.children.length; i++) {
            if (element === currentElement.children[i]) {
                currentElement.children.splice(i, 1);//i番目から1つだけ削除
            }
        }
    }

    static removeChildAll(currentElement) {
        currentElement.children = [];
    }
}