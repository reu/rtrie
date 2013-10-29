# Rtrie

Trie based autocomplete with Redis.

## Usage

```javascript
var Rtrie = require("rtrie"),
    cities = new Rtrie("cities");

// index(term, id[, metadata, priority])
cities.index("Campinas", 1, { state: "SP", population: 1000000 }, 10);
cities.index("Americana", 2, { state: "SP", population: 250000 });
cities.index("Santa Bárbara D'Oeste", 3, { state: "SP", population: 190000 });
cities.index("Campina Grande", 4, { state: "PB", population: 20000 });

// search(term, callback)
cities.search("Campin", function(id, term, data) {
  // will call with "Campinas" first because of the priority:
  // [1, "Campinas", { state: "SP", population: 1000000 }]
  // [4, "Campina Grande", { state: "PB", population: 20000 }]
});

You can also specify a limit for the search function:
var limit = 1;
cities.search("Campin", limit, function(id, term, data) {
  // will call with:
  // [1, "Campinas", { state: "SP", population: 1000000 }]
});

You may also creat a totally different item type database:
var names = new Rtrie("names");

names.index("Rodrigo", 1, { age: 27 });
names.index("Gustavo", 2, { age: 16 });
names.index("Frederico", 3, { age: 30 });
```
