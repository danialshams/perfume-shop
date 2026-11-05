export default function FilterBarSkeleton(){
 return <div className="fertini-filter-placeholder" role="status" aria-label="در حال بارگذاری فیلترها">
  <div><div className="fertini-skeleton" style={{width:130,height:10}}/><div className="fertini-skeleton" style={{width:150,height:20}}/></div>
  <div><div className="fertini-skeleton" style={{width:110,height:43}}/><div className="fertini-skeleton" style={{width:130,height:43}}/></div>
 </div>;
}
