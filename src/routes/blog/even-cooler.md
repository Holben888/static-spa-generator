---
title: An EVEN BETTER post.
description: I further outline my dopeness with visual aids.
layout: blog-post
---

# Further descension into dopeness

Additionally, `I am extremely wise`. Here's some incredible code I wrote.

::: highlight {style="--line-start: 4; --line-end: 6"}
```js
import React, { useState } from 'react';

export default () => {
  const [a, setA] = useState(1);
  const [b, setB] = useState(2);

  function handleChangeA(event) {
    setA(+event.target.value);
  }

  function handleChangeB(event) {
    setB(+event.target.value);
  }

  return (
    <div>
      <input type="number" value={a} onChange={handleChangeA}/>
      <input type="number" value={b} onChange={handleChangeB}/>

      <p>{a} + {b} = {a + b}</p>
    </div>
  );
};
```
:::