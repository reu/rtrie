# Rtrie

Trie based autocomplete with Redis.

## Usage

```javascript
var rtrie = require("rtrie");

// index(term, id[, metadata])
rtrie.index("Campinas", 1, { state: "SP", population: 1000000 });
rtrie.index("Americana", 2, { state: "SP", population: 250000 });
rtrie.index("Santa Bárbara D'Oeste", 3, { state: "SP", population: 190000 });
rtrie.index("Campina Grande", 4, { state: "PB", population: 20000 });

// search(term, callback)
rtrie.search("Campin", function(id, term, data) {
  ...
});
```
