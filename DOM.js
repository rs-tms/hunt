const $ = (selector, node = null) => {
    if(node === null){
        node = document;
    }

    switch(selector[0]) {
        case ".": return node.getElementsByClassName(selector.slice(1));
        case "#": return node.getElementById(selector.slice(1));
        default: return node.getElementsByTagName(selector);
    }
}; 