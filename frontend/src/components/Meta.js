import React from "react";
import { Helmet } from "react-helmet";

const Meta = ({ title, description, keywords }) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keyword" content={keywords} />
    </Helmet>
  );
};

Meta.defaultProps = {
  title: "Welcome To StoRM",
  description: "Sports gear for every game: balls, rackets, gloves and fitness",
  keywords: "sports, sports gear, fitness, balls, rackets",
};

export default Meta;
